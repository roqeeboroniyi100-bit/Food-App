import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { MENU_ITEMS } from './src/data/menu.ts';
import type {
  FulfillmentType,
  OrderItemSummary,
  OrderRecord,
  OrderStage,
  PaymentMethod,
  PromoResult,
} from './src/types/food.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
const TAX_RATE = 0.085;
const FREE_DELIVERY_THRESHOLD = 35;
const DELIVERY_FEE = 4.99;

const STORE_FILE = path.join(__dirname, '.orders-store.json');

interface IncomingOrderItem {
  menuItemId: string;
  quantity: number;
  selectedOptionIds: string[];
  specialInstructions?: string;
}

interface IncomingOrderPayload {
  fulfillment: FulfillmentType;
  scheduledTime: string;
  customer: {
    name: string;
    phone: string;
    email: string;
    address?: string;
    apt?: string;
    deliveryNotes?: string;
  };
  paymentMethod: PaymentMethod;
  promoCode?: string;
  tipPercent?: number;
  items: IncomingOrderItem[];
}

function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100;
}

function evaluatePromo(codeRaw: string | undefined, subtotal: number): PromoResult {
  const code = (codeRaw ?? '').trim().toUpperCase();
  if (!code) {
    return { valid: false, code: '', message: 'Enter a promo code.', discountAmount: 0, freeDelivery: false };
  }
  if (code === 'WELCOME10') {
    return {
      valid: true,
      code,
      message: '10% off your order applied.',
      discountAmount: roundCurrency(subtotal * 0.1),
      freeDelivery: false,
    };
  }
  if (code === 'FREESHIP') {
    return {
      valid: true,
      code,
      message: 'Free delivery applied to this order.',
      discountAmount: 0,
      freeDelivery: true,
    };
  }
  if (code === 'HEARTH15') {
    if (subtotal < 45) {
      return {
        valid: false,
        code,
        message: 'HEARTH15 requires a $45.00 minimum subtotal.',
        discountAmount: 0,
        freeDelivery: false,
      };
    }
    return {
      valid: true,
      code,
      message: '15% off orders $45+ applied.',
      discountAmount: roundCurrency(subtotal * 0.15),
      freeDelivery: false,
    };
  }
  return {
    valid: false,
    code,
    message: 'Invalid code. Try WELCOME10, FREESHIP, or HEARTH15.',
    discountAmount: 0,
    freeDelivery: false,
  };
}

const initialSeedOrder: OrderRecord = {
  id: 'EG-1041',
  createdAt: new Date(Date.now() - 1000 * 60 * 14).toISOString(),
  fulfillment: 'delivery',
  scheduledTime: 'ASAP (25–35 min)',
  customer: {
    name: 'Maya Lin',
    phone: '(415) 555-0194',
    email: 'maya.lin@example.com',
    address: '742 Valencia St, San Francisco',
    apt: 'Apt 3B',
    deliveryNotes: 'Ring buzzer 3B at the front gate.',
  },
  paymentMethod: 'card',
  items: [
    {
      menuItemId: 'mushroom-taleggio-flatbread',
      name: 'Wild Mushroom & Taleggio Flatbread',
      quantity: 1,
      unitPrice: 22.0,
      lineTotal: 22.0,
      optionsSummary: ['Classic 11" Sourdough', 'Black Truffle Honey Drizzle'],
    },
    {
      menuItemId: 'miso-salmon-bowl',
      name: 'Cedar-Roasted Miso Salmon Bowl',
      quantity: 1,
      unitPrice: 22.0,
      lineTotal: 22.0,
      optionsSummary: ['Warm Forbidden Black Rice'],
    },
  ],
  subtotal: 44.0,
  discount: 4.4,
  promoCode: 'WELCOME10',
  deliveryFee: 0,
  tax: 3.37,
  tip: 6.6,
  total: 49.57,
  stage: 'out_for_delivery',
  estimatedMinutes: 11,
  stageUpdatedAt: new Date().toISOString(),
};

const ordersMap = new Map<string, OrderRecord>();
let nextOrderNumber = 1042;

function loadStoredOrders() {
  try {
    if (fs.existsSync(STORE_FILE)) {
      const raw = fs.readFileSync(STORE_FILE, 'utf-8');
      const parsed = JSON.parse(raw) as { orders?: OrderRecord[]; nextOrderNumber?: number };
      if (Array.isArray(parsed.orders)) {
        for (const ord of parsed.orders) {
          ordersMap.set(ord.id, ord);
        }
      }
      if (typeof parsed.nextOrderNumber === 'number' && parsed.nextOrderNumber > nextOrderNumber) {
        nextOrderNumber = parsed.nextOrderNumber;
      }
    }
  } catch {
    // Graceful fallback to in-memory store
  }

  if (!ordersMap.has(initialSeedOrder.id)) {
    ordersMap.set(initialSeedOrder.id, initialSeedOrder);
  }
}

function persistOrders() {
  try {
    const payload = {
      nextOrderNumber,
      orders: Array.from(ordersMap.values()),
    };
    fs.writeFileSync(STORE_FILE, JSON.stringify(payload, null, 2), 'utf-8');
  } catch {
    // Ignore read-only filesystem errors
  }
}

function computeLiveOrder(order: OrderRecord): OrderRecord {
  if (order.stage === 'completed') {
    return order;
  }

  const elapsedSeconds = (Date.now() - new Date(order.createdAt).getTime()) / 1000;
  let stage: OrderStage = order.stage;
  let estimatedMinutes = order.estimatedMinutes;

  if (order.id !== 'EG-1041') {
    if (elapsedSeconds >= 90) {
      stage = 'completed';
      estimatedMinutes = 0;
    } else if (elapsedSeconds >= 45) {
      stage = order.fulfillment === 'delivery' ? 'out_for_delivery' : 'ready_for_pickup';
      estimatedMinutes = order.fulfillment === 'delivery' ? 8 : 0;
    } else if (elapsedSeconds >= 12) {
      stage = 'preparing';
      estimatedMinutes = order.fulfillment === 'delivery' ? 22 : 14;
    } else {
      stage = 'confirmed';
      estimatedMinutes = order.fulfillment === 'delivery' ? 30 : 20;
    }
  }

  return {
    ...order,
    stage,
    estimatedMinutes,
  };
}

loadStoredOrders();

async function startServer() {
  const app = express();
  app.use(express.json());

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true });
  });

  app.get('/api/menu', (_req, res) => {
    res.json({ items: MENU_ITEMS });
  });

  app.post('/api/promo/validate', (req, res) => {
    const { code, subtotal } = req.body as { code?: string; subtotal?: number };
    const safeSubtotal = typeof subtotal === 'number' && Number.isFinite(subtotal) ? Math.max(0, subtotal) : 0;
    res.json(evaluatePromo(code, safeSubtotal));
  });

  app.get('/api/orders', (_req, res) => {
    const list = Array.from(ordersMap.values())
      .map(computeLiveOrder)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    res.json({ orders: list });
  });

  app.get('/api/orders/:id', (req, res) => {
    const lookupId = req.params.id.trim().toUpperCase();
    const order = ordersMap.get(lookupId);
    if (!order) {
      res.status(404).json({ error: `Order ${lookupId} was not found.` });
      return;
    }
    res.json({ order: computeLiveOrder(order) });
  });

  app.post('/api/orders/:id/advance', (req, res) => {
    const lookupId = req.params.id.trim().toUpperCase();
    const order = ordersMap.get(lookupId);
    if (!order) {
      res.status(404).json({ error: `Order ${lookupId} was not found.` });
      return;
    }
    const current = computeLiveOrder(order);
    const midStage: OrderStage =
      current.fulfillment === 'delivery' ? 'out_for_delivery' : 'ready_for_pickup';
    const sequence: OrderStage[] = ['confirmed', 'preparing', midStage, 'completed'];
    const idx = sequence.indexOf(current.stage);
    const nextStage = idx >= 0 && idx < sequence.length - 1 ? sequence[idx + 1] : 'completed';

    const updated: OrderRecord = {
      ...current,
      stage: nextStage,
      estimatedMinutes:
        nextStage === 'completed'
          ? 0
          : nextStage === midStage
            ? current.fulfillment === 'delivery'
              ? 6
              : 0
            : 18,
      stageUpdatedAt: new Date().toISOString(),
    };
    // Shift createdAt back so computeLiveOrder doesn't regress it
    if (nextStage === 'preparing') {
      updated.createdAt = new Date(Date.now() - 15000).toISOString();
    } else if (nextStage === midStage) {
      updated.createdAt = new Date(Date.now() - 50000).toISOString();
    } else if (nextStage === 'completed') {
      updated.createdAt = new Date(Date.now() - 95000).toISOString();
    }

    ordersMap.set(lookupId, updated);
    persistOrders();
    res.json({ order: updated });
  });

  app.post('/api/orders', (req, res) => {
    const body = req.body as IncomingOrderPayload;

    if (!body || !Array.isArray(body.items) || body.items.length === 0) {
      res.status(400).json({ error: 'Your bag is empty.' });
      return;
    }

    if (!body.customer?.name?.trim() || !body.customer?.phone?.trim() || !body.customer?.email?.trim()) {
      res.status(400).json({ error: 'Please provide your name, phone number, and email.' });
      return;
    }

    if (body.fulfillment === 'delivery' && !body.customer.address?.trim()) {
      res.status(400).json({ error: 'Please provide a street address for delivery.' });
      return;
    }

    const orderItems: OrderItemSummary[] = [];
    let subtotal = 0;

    for (const incoming of body.items) {
      const menuItem = MENU_ITEMS.find((m) => m.id === incoming.menuItemId);
      if (!menuItem) {
        res.status(400).json({ error: `Unknown menu item: ${incoming.menuItemId}` });
        return;
      }

      const qty = Math.max(1, Math.min(20, Math.floor(incoming.quantity || 1)));
      const optionIds = new Set(incoming.selectedOptionIds ?? []);
      const optionsSummary: string[] = [];
      let optionDelta = 0;

      for (const group of menuItem.optionGroups) {
        for (const opt of group.options) {
          if (optionIds.has(opt.id)) {
            optionDelta += opt.priceDelta;
            optionsSummary.push(opt.label);
          }
        }
      }

      const unitPrice = roundCurrency(menuItem.price + optionDelta);
      const lineTotal = roundCurrency(unitPrice * qty);
      subtotal = roundCurrency(subtotal + lineTotal);

      orderItems.push({
        menuItemId: menuItem.id,
        name: menuItem.name,
        quantity: qty,
        unitPrice,
        lineTotal,
        optionsSummary,
        specialInstructions: incoming.specialInstructions?.trim() || undefined,
      });
    }

    const promo = evaluatePromo(body.promoCode, subtotal);
    const discount = promo.valid ? promo.discountAmount : 0;
    const discountedSubtotal = Math.max(0, roundCurrency(subtotal - discount));

    const qualifiesFreeDelivery =
      body.fulfillment === 'pickup' ||
      subtotal >= FREE_DELIVERY_THRESHOLD ||
      (promo.valid && promo.freeDelivery);

    const deliveryFee = qualifiesFreeDelivery ? 0 : DELIVERY_FEE;
    const tax = roundCurrency(discountedSubtotal * TAX_RATE);
    const safeTipPercent =
      typeof body.tipPercent === 'number' && [0, 10, 15, 20].includes(body.tipPercent)
        ? body.tipPercent
        : 15;
    const tip = roundCurrency(subtotal * (safeTipPercent / 100));
    const total = roundCurrency(discountedSubtotal + deliveryFee + tax + tip);

    const orderId = `EG-${nextOrderNumber++}`;
    const nowIso = new Date().toISOString();

    const newOrder: OrderRecord = {
      id: orderId,
      createdAt: nowIso,
      fulfillment: body.fulfillment === 'pickup' ? 'pickup' : 'delivery',
      scheduledTime: body.scheduledTime || (body.fulfillment === 'pickup' ? 'ASAP (15–20 min)' : 'ASAP (25–35 min)'),
      customer: {
        name: body.customer.name.trim(),
        phone: body.customer.phone.trim(),
        email: body.customer.email.trim(),
        address: body.customer.address?.trim(),
        apt: body.customer.apt?.trim(),
        deliveryNotes: body.customer.deliveryNotes?.trim(),
      },
      paymentMethod: body.paymentMethod || 'card',
      items: orderItems,
      subtotal,
      discount,
      promoCode: promo.valid ? promo.code : undefined,
      deliveryFee,
      tax,
      tip,
      total,
      stage: 'confirmed',
      estimatedMinutes: body.fulfillment === 'pickup' ? 20 : 30,
      stageUpdatedAt: nowIso,
    };

    ordersMap.set(orderId, newOrder);
    persistOrders();

    res.status(201).json({ order: newOrder });
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Ember & Grain server listening on http://localhost:${PORT}`);
  });
}

startServer();
