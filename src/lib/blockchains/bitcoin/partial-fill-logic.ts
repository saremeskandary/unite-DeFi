import { PartialFillManager } from './partial-fill-manager';

export interface PartialFillParams {
  totalAmount: string;
  partialAmounts: string[];
  fromToken: string;
  toToken: string;
  userAddress: string;
  timelock: number;
}

export interface PartialFillOrder {
  orderId: string;
  status: 'pending' | 'executing' | 'completed' | 'cancelled';
  totalAmount: string;
  partialOrders: PartialOrder[];
  createdAt: number;
  updatedAt: number;
}

export interface PartialOrder {
  id: string;
  amount: string;
  status: 'pending' | 'assigned' | 'executing' | 'completed' | 'failed';
  resolverId?: string;
  secret?: string;
  secretHash?: string;
}

export interface ResolverAssignment {
  partialOrderId: string;
  resolverId: string;
  assignedAt: number;
}

export interface ResolverBid {
  partialOrderId: string;
  resolverId: string;
  bidAmount: string;
  fee: string;
  status: 'submitted' | 'accepted' | 'rejected';
  submittedAt: number;
}

export interface PartialFillProgress {
  totalParts: number;
  completedParts: number;
  completionPercentage: number;
  estimatedTimeRemaining?: number;
}

export interface PartialFillAnalytics {
  totalOrders: number;
  completedOrders: number;
  averageExecutionTime: number;
  successRate: number;
  totalFees: number;
  partialFillStats: {
    averageParts: number;
    completionRate: number;
  };
}

/**
 * Partial Fill Logic
 * Handles partial fill order creation and multiple resolver coordination
 */
export class PartialFillLogic {
  private orders: Map<string, PartialFillOrder> = new Map();
  private assignments: Map<string, ResolverAssignment[]> = new Map();
  private bids: Map<string, ResolverBid[]> = new Map();
  private executions: Map<string, any[]> = new Map();

  constructor(private partialFillManager: PartialFillManager) { }

  /**
   * Create partial fill order with multiple amounts
   */
  async createPartialFillOrder(params: PartialFillParams): Promise<PartialFillOrder> {
    // Validate partial amounts sum to total
    const totalPartial = params.partialAmounts.reduce((sum, amount) => sum + parseFloat(amount), 0);
    const totalAmount = parseFloat(params.totalAmount);

    if (Math.abs(totalPartial - totalAmount) > 0.000001) {
      throw new Error('Partial amounts must sum to total amount');
    }

    const orderId = `pf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const partialOrders: PartialOrder[] = params.partialAmounts.map((amount, index) => ({
      id: `${orderId}_partial_${index}`,
      amount,
      status: 'pending'
    }));

    const order: PartialFillOrder = {
      orderId,
      status: 'pending',
      totalAmount: params.totalAmount,
      partialOrders,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    this.orders.set(orderId, order);
    return order;
  }

  /**
   * Get partial fill order by ID
   */
  async getPartialFillOrder(orderId: string): Promise<PartialFillOrder> {
    const order = this.orders.get(orderId);
    if (!order) {
      throw new Error(`Order not found: ${orderId}`);
    }
    return order;
  }

  /**
   * Modify partial fill order
   */
  async modifyPartialFillOrder(orderId: string, modifications: { partialAmounts?: string[] }): Promise<PartialFillOrder> {
    const order = await this.getPartialFillOrder(orderId);

    if (modifications.partialAmounts) {
      // Validate new amounts
      const totalPartial = modifications.partialAmounts.reduce((sum, amount) => sum + parseFloat(amount), 0);
      const totalAmount = parseFloat(order.totalAmount);

      if (Math.abs(totalPartial - totalAmount) > 0.000001) {
        throw new Error('Partial amounts must sum to total amount');
      }

      // Update partial orders
      order.partialOrders = modifications.partialAmounts.map((amount, index) => ({
        id: `${orderId}_partial_${index}`,
        amount,
        status: 'pending'
      }));
    }

    order.updatedAt = Date.now();
    this.orders.set(orderId, order);
    return order;
  }

  /**
   * Cancel partial fill order
   */
  async cancelPartialFillOrder(orderId: string): Promise<void> {
    const order = await this.getPartialFillOrder(orderId);
    order.status = 'cancelled';
    order.updatedAt = Date.now();
    this.orders.set(orderId, order);
  }

  /**
   * Assign multiple resolvers to partial orders
   */
  async assignResolvers(orderId: string): Promise<ResolverAssignment[]> {
    const order = await this.getPartialFillOrder(orderId);
    const assignments: ResolverAssignment[] = [];

    order.partialOrders.forEach(partialOrder => {
      const resolverId = `resolver_${Math.random().toString(36).substr(2, 9)}`;
      assignments.push({
        partialOrderId: partialOrder.id,
        resolverId,
        assignedAt: Date.now()
      });

      // Update partial order status
      partialOrder.status = 'assigned';
      partialOrder.resolverId = resolverId;
    });

    this.assignments.set(orderId, assignments);
    order.updatedAt = Date.now();
    this.orders.set(orderId, order);

    return assignments;
  }

  /**
   * Submit resolver bid
   */
  async submitResolverBid(partialOrderId: string, bid: Omit<ResolverBid, 'status' | 'submittedAt'>): Promise<ResolverBid> {
    const fullBid: ResolverBid = {
      ...bid,
      status: 'submitted',
      submittedAt: Date.now()
    };

    if (!this.bids.has(partialOrderId)) {
      this.bids.set(partialOrderId, []);
    }
    this.bids.get(partialOrderId)!.push(fullBid);

    return fullBid;
  }

  /**
   * Execute partial fill
   */
  async executePartialFill(partialOrderId: string, resolverId: string, options?: { crossChainCoordinated?: boolean; fallbackMode?: boolean }): Promise<any> {
    // Check if already executed
    const existingExecutions = this.executions.get(partialOrderId) || [];
    if (existingExecutions.length > 0) {
      throw new Error(`Partial order ${partialOrderId} already executed`);
    }

    const execution = {
      partialOrderId,
      resolverId,
      status: 'executed',
      executionTime: Date.now(),
      crossChainCoordinated: options?.crossChainCoordinated || false,
      fallbackMode: options?.fallbackMode || false
    };

    if (!this.executions.has(partialOrderId)) {
      this.executions.set(partialOrderId, []);
    }
    this.executions.get(partialOrderId)!.push(execution);

    // Update partial order status
    const orderId = partialOrderId.split('_partial_')[0];
    const order = await this.getPartialFillOrder(orderId);
    const partialOrder = order.partialOrders.find(po => po.id === partialOrderId);
    if (partialOrder) {
      partialOrder.status = 'completed';
    }
    order.updatedAt = Date.now();
    this.orders.set(orderId, order);

    return execution;
  }

  /**
   * Mark resolver as failed
   */
  async markResolverFailed(partialOrderId: string, resolverId: string): Promise<void> {
    const orderId = partialOrderId.split('_partial_')[0];
    const order = await this.getPartialFillOrder(orderId);
    const partialOrder = order.partialOrders.find(po => po.id === partialOrderId);
    if (partialOrder) {
      partialOrder.status = 'failed';
    }
    order.updatedAt = Date.now();
    this.orders.set(orderId, order);
  }

  /**
   * Reassign failed resolver
   */
  async reassignFailedResolver(partialOrderId: string): Promise<ResolverAssignment> {
    const newResolverId = `resolver_${Math.random().toString(36).substr(2, 9)}`;
    const orderId = partialOrderId.split('_partial_')[0];
    const order = await this.getPartialFillOrder(orderId);
    const partialOrder = order.partialOrders.find(po => po.id === partialOrderId);

    if (partialOrder) {
      partialOrder.status = 'assigned';
      partialOrder.resolverId = newResolverId;
    }

    const assignment: ResolverAssignment = {
      partialOrderId,
      resolverId: newResolverId,
      assignedAt: Date.now()
    };

    order.updatedAt = Date.now();
    this.orders.set(orderId, order);

    return assignment;
  }

  /**
   * Get partial fill progress
   */
  async getPartialFillProgress(orderId: string): Promise<PartialFillProgress> {
    const order = await this.getPartialFillOrder(orderId);
    const totalParts = order.partialOrders.length;
    const completedParts = order.partialOrders.filter(po => po.status === 'completed').length;
    const completionPercentage = (completedParts / totalParts) * 100;

    return {
      totalParts,
      completedParts,
      completionPercentage
    };
  }

  /**
   * Get partial fill analytics
   */
  async getPartialFillAnalytics(orderId: string): Promise<PartialFillAnalytics> {
    const order = await this.getPartialFillOrder(orderId);
    const totalOrders = 1;
    const completedOrders = order.status === 'completed' ? 1 : 0;
    const averageExecutionTime = 5000; // Mock value
    const successRate = order.status === 'completed' ? 1.0 : 0.0;
    const totalFees = 0.001; // Mock value

    return {
      totalOrders,
      completedOrders,
      averageExecutionTime,
      successRate,
      totalFees,
      partialFillStats: {
        averageParts: order.partialOrders.length,
        completionRate: order.partialOrders.filter(po => po.status === 'completed').length / order.partialOrders.length
      }
    };
  }

  /**
   * Mark partial fill as complete
   */
  async markPartialFillComplete(orderId: string): Promise<void> {
    const order = await this.getPartialFillOrder(orderId);
    order.status = 'completed';
    order.updatedAt = Date.now();
    this.orders.set(orderId, order);
  }
} 