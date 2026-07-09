/**
 * PizzaFlow — DashboardService
 * Calcula métricas do Dashboard a partir dos pedidos e configurações do Firestore.
 */

import { isFirebaseActive } from './firebase.js';
import { OrderService } from './OrderService.js';
import { mockBusinessHours } from '@data/mockData.js';

export const DashboardService = {
  /**
   * Busca e consolida as métricas do Dashboard
   */
  async getDashboardMetrics(filters = {}) {
    // 1. Busca todos os pedidos recentes do banco
    const orders = await OrderService.getOrders({ limit: 100 });

    // 2. Filtra os pedidos criados hoje
    const todayStr = new Date().toISOString().split('T')[0];
    const todayOrders = orders.filter(o => {
      if (!o.createdAt) return false;
      return o.createdAt.startsWith(todayStr);
    });

    // 3. Calcula Faturamento e Quantidade
    const todayOrdersCount = todayOrders.length;
    const todayRevenueSum = todayOrders.reduce((sum, o) => {
      // Garante conversão numérica do total do pedido
      const orderTotal = parseFloat(o.total || o.cart?.total || 0);
      return sum + orderTotal;
    }, 0);

    const averageTicket = todayOrdersCount > 0 ? (todayRevenueSum / todayOrdersCount) : 0;

    // 4. Calcula contagens da fila de produção
    const productionCounts = {
      novos: orders.filter(o => o.status === 'PENDING' || o.status === 'CONFIRMED').length,
      preparo: orders.filter(o => o.status === 'PREPARING').length,
      forno: orders.filter(o => o.status === 'OVEN').length,
      prontos: orders.filter(o => o.status === 'READY').length,
      entrega: orders.filter(o => o.status === 'OUT_FOR_DELIVERY').length
    };

    // 5. Verifica se está aberto com base nas horas
    const now = new Date();
    const day = now.getDay();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const current = `${hours}:${minutes}`;

    const config = mockBusinessHours.find(h => h.dayOfWeek === day && h.active);
    let isOpen = false;
    if (config) {
      if (config.closeTime > config.openTime) {
        isOpen = current >= config.openTime && current <= config.closeTime;
      } else {
        isOpen = current >= config.openTime || current <= config.closeTime;
      }
    } else {
      isOpen = current >= '18:00' && current <= '23:30';
    }

    return {
      kpis: {
        todayOrdersCount,
        todayRevenueSum: parseFloat(todayRevenueSum.toFixed(2)),
        averageTicket: parseFloat(averageTicket.toFixed(2)),
        averagePrepTime: 22, // Tempo fixo/estimado médio em minutos
        isOpen
      },
      productionCounts,
      recentOrders: orders.slice(0, 10) // Retorna os 10 últimos pedidos
    };
  }
};
