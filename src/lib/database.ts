import Dexie, { Table } from 'dexie';

export interface Product {
  id?: number;
  name: string;
  description: string;
  imageUrl: string;
  price: number;
  currentStock: number;
  minStock: number;
  createdBy?: string;
}

export interface User {
  id?: number;
  username: string;
  fullName: string;
  role: 'admin' | 'cashier';
  passwordHash: string;
  email?: string;
  isActive?: boolean;
}

export interface Sale {
  id?: number;
  productId: number;
  productName: string;
  quantity: number;
  salePrice: number;
  subtotal: number;
  igv: number;
  total: number;
  paymentMethod: 'efectivo' | 'tarjeta' | 'yape';
  amountReceived?: number;
  change?: number;
  cashierId: number;
  customerId?: number;
  date: Date;
}

export interface Purchase {
  id?: number;
  productId: number;
  productName: string;
  quantity: number;
  purchasePrice: number;
  supplierId?: number;
  supplierName?: string;
  date: Date;
  cashierId: number;
  description?: string;
}

export interface InventoryLog {
  id?: number;
  productId: number;
  productName: string;
  date: Date;
  changeInStock: number;
  newStockLevel: number;
  description: string;
}

export interface Supplier {
    id?: number;
    name: string;
    contactName: string;
    contactEmail: string;
    contactPhone: string;
    address: string;
}

export interface Customer {
  id?: number;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  dni?: string;
  description?: string;
  createdAt: Date;
}

export class MyDatabase extends Dexie {
  products!: Table<Product>;
  users!: Table<User>;
  sales!: Table<Sale>;
  purchases!: Table<Purchase>;
  inventoryLogs!: Table<InventoryLog>;
  suppliers!: Table<Supplier>;
  customers!: Table<Customer>;

  constructor() {
    super('BioxDB');
    this.version(6).stores({
      products: '++id, name, price, currentStock, minStock',
      users: '++id, username, fullName, role, passwordHash, email, isActive',
      sales: '++id, productId, productName, quantity, salePrice, total, cashierId, customerId, date, paymentMethod',
      purchases: '++id, productId, productName, quantity, purchasePrice, supplierId, cashierId, date',
      inventoryLogs: '++id, productId, productName, date, changeInStock, newStockLevel, description',
      suppliers: '++id, name, contactName, contactEmail, contactPhone, address',
      customers: '++id, firstName, lastName, email, phone, dni, createdAt'
    });
  }
}

export const database = {
  db: null as MyDatabase | null,

  async init(): Promise<void> {
    if (!this.db) {
      this.db = new MyDatabase();
      await this.db.open();
    }
  },

  async getDB(): Promise<MyDatabase> {
    if (!this.db) {
      this.db = new MyDatabase();
      await this.db.open();
    }
    return this.db;
  },

  // Product methods
  async createProduct(product: Omit<Product, 'id'>): Promise<number> {
    const db = await this.getDB();
    const productData = {
      ...product,
      imageUrl: product.imageUrl || '',
      price: product.price || 0
    };
    return await db.products.add(productData);
  },

  async addProduct(product: Omit<Product, 'id'>): Promise<number> {
    return await this.createProduct(product);
  },

  async getProductById(id: number): Promise<Product | undefined> {
    const db = await this.getDB();
    return await db.products.get(id);
  },

  async getAllProducts(): Promise<Product[]> {
    const db = await this.getDB();
    return await db.products.toArray();
  },

  async updateProduct(id: number, updates: Partial<Product>): Promise<void> {
    const db = await this.getDB();
    await db.products.update(id, updates);
  },

  async deleteProduct(id: number): Promise<void> {
    const db = await this.getDB();
    await db.products.delete(id);
  },

  async getLowStockProducts(): Promise<Product[]> {
    const db = await this.getDB();
    return await db.products.where('currentStock').belowOrEqual(db.products.schema.indexes.find(i => i.name === 'minStock')?.keyPath || 0).toArray();
  },

  async getCriticalStockAlerts(): Promise<Product[]> {
    const db = await this.getDB();
    const products = await db.products.toArray();
    return products.filter(product => product.currentStock <= product.minStock);
  },

  // User methods
  async createUser(user: Omit<User, 'id'>): Promise<number> {
    const db = await this.getDB();
    return await db.users.add(user);
  },

  async addUser(user: Omit<User, 'id'> & { password?: string }): Promise<number> {
    const userData = {
      ...user,
      passwordHash: user.password || user.passwordHash || 'default'
    };
    delete (userData as any).password;
    return await this.createUser(userData);
  },

  async getUser(username: string, password: string): Promise<User | null> {
    const db = await this.getDB();
    const user = await db.users.where({ username: username }).first();
    if (user && (user.passwordHash === password || password === user.passwordHash)) {
      return user;
    }
    return null;
  },

  async getUserByUsername(username: string): Promise<User | undefined> {
    const db = await this.getDB();
    return await db.users.where({ username: username }).first();
  },

  async getUserById(id: number): Promise<User | undefined> {
    const db = await this.getDB();
    return await db.users.get(id);
  },

  async getAllUsers(): Promise<User[]> {
    const db = await this.getDB();
    return await db.users.toArray();
  },

  async getAllCashiers(): Promise<User[]> {
    const db = await this.getDB();
    return await db.users.where({ role: 'cashier' }).toArray();
  },

  async updateUser(id: number, updates: Partial<User>): Promise<void> {
    const db = await this.getDB();
    await db.users.update(id, updates);
  },

  async updateCashierStatus(id: number, isActive: boolean): Promise<void> {
    const db = await this.getDB();
    await db.users.update(id, { isActive });
  },

  async deleteUser(id: number): Promise<void> {
    const db = await this.getDB();
    await db.users.delete(id);
  },

  // Sale methods
  async createSale(sale: Omit<Sale, 'id' | 'subtotal' | 'igv' | 'change'>): Promise<Sale> {
    const db = await this.getDB();
    
    try {
      // Calcular subtotal e IGV (18%)
      const subtotal = sale.total / 1.18;
      const igv = sale.total - subtotal;
      
      // Calcular vuelto si es efectivo
      let change = 0;
      if (sale.paymentMethod === 'efectivo' && sale.amountReceived) {
        change = sale.amountReceived - sale.total;
      }
      
      const saleData = {
        ...sale,
        subtotal: parseFloat(subtotal.toFixed(2)),
        igv: parseFloat(igv.toFixed(2)),
        change: parseFloat(change.toFixed(2))
      };
      
      // Usar transacción de Dexie correctamente
      const result = await db.transaction('rw', db.sales, db.products, async () => {
        // Crear la venta
        const saleId = await db.sales.add(saleData);
        
        // Actualizar el stock del producto
        const product = await db.products.get(sale.productId);
        if (product) {
          product.currentStock -= sale.quantity;
          await db.products.update(sale.productId, { currentStock: product.currentStock });
        }
        
        // Retornar la venta creada con su ID
        return { ...saleData, id: saleId };
      });
      
      return result;
    } catch (error) {
      console.error('Error creating sale:', error);
      throw new Error('No se pudo registrar la venta');
    }
  },

  async getAllSales(): Promise<Sale[]> {
    const db = await this.getDB();
    return await db.sales.toArray();
  },

  async getSalesByUser(userId: number): Promise<Sale[]> {
    const db = await this.getDB();
    return await db.sales.where({ cashierId: userId }).toArray();
  },

  async getSalesByDateRange(startDate: Date, endDate: Date): Promise<Sale[]> {
    const db = await this.getDB();
    return await db.sales.where('date').between(startDate, endDate).toArray();
  },

  async deleteSale(saleId: number): Promise<void> {
    const db = await this.getDB();
    
    try {
      await db.transaction('rw', db.sales, db.products, async () => {
        // Primero obtener la venta para restaurar el stock
        const sale = await db.sales.get(saleId);
        if (sale) {
          const product = await db.products.get(sale.productId);
          if (product) {
            // Restaurar el stock
            product.currentStock += sale.quantity;
            await db.products.update(sale.productId, { currentStock: product.currentStock });
          }
        }
        
        // Eliminar la venta
        await db.sales.delete(saleId);
      });
    } catch (error) {
      console.error('Error deleting sale:', error);
      throw new Error('No se pudo eliminar la venta');
    }
  },

  async getSaleById(saleId: number): Promise<Sale | null> {
    const db = await this.getDB();
    try {
      const sale = await db.sales.get(saleId);
      return sale || null;
    } catch (error) {
      console.error('Error getting sale:', error);
      return null;
    }
  },

  // Purchase methods
  async createPurchase(purchase: Omit<Purchase, 'id'>): Promise<number> {
    const db = await this.getDB();
    
    try {
      // Usar transacción de Dexie correctamente
      const result = await db.transaction('rw', db.purchases, db.products, async () => {
        // Crear la compra
        const purchaseId = await db.purchases.add(purchase);
        
        // Actualizar el stock del producto
        const product = await db.products.get(purchase.productId);
        if (product) {
          product.currentStock += purchase.quantity;
          await db.products.update(purchase.productId, { currentStock: product.currentStock });
        }
        
        return purchaseId;
      });
      
      return result;
    } catch (error) {
      console.error('Error creating purchase:', error);
      throw new Error('No se pudo registrar la compra');
    }
  },

  async getAllPurchases(): Promise<Purchase[]> {
    const db = await this.getDB();
    return await db.purchases.toArray();
  },

  async getPurchasesByUser(userId: number): Promise<Purchase[]> {
    const db = await this.getDB();
    return await db.purchases.where({ cashierId: userId }).toArray();
  },

  async getPurchasesByDateRange(startDate: Date, endDate: Date): Promise<Purchase[]> {
    const db = await this.getDB();
    return await db.purchases.where('date').between(startDate, endDate).toArray();
  },

  // Inventory log methods
  async createInventoryLog(log: Omit<InventoryLog, 'id'>): Promise<number> {
    const db = await this.getDB();
    return await db.inventoryLogs.add(log);
  },

  async getInventoryLogsByProduct(productId: number): Promise<InventoryLog[]> {
    const db = await this.getDB();
    return await db.inventoryLogs.where({ productId: productId }).toArray();
  },

  // Supplier methods
  async createSupplier(supplier: Omit<Supplier, 'id'>): Promise<number> {
    const db = await this.getDB();
    return await db.suppliers.add(supplier);
  },

  async getSupplierById(id: number): Promise<Supplier | undefined> {
    const db = await this.getDB();
    return await db.suppliers.get(id);
  },

  async getAllSuppliers(): Promise<Supplier[]> {
    const db = await this.getDB();
    return await db.suppliers.toArray();
  },

  async updateSupplier(id: number, updates: Partial<Supplier>): Promise<void> {
    const db = await this.getDB();
    await db.suppliers.update(id, updates);
  },

  async deleteSupplier(id: number): Promise<void> {
    const db = await this.getDB();
    await db.suppliers.delete(id);
  },

  // Customer methods
  async createCustomer(customer: Omit<Customer, 'id'>): Promise<number> {
    const db = await this.getDB();
    const customerData = {
      ...customer,
      createdAt: new Date()
    };
    return await db.customers.add(customerData);
  },

  async getCustomerById(id: number): Promise<Customer | undefined> {
    const db = await this.getDB();
    return await db.customers.get(id);
  },

  async getAllCustomers(): Promise<Customer[]> {
    const db = await this.getDB();
    return await db.customers.orderBy('firstName').toArray();
  },

  async updateCustomer(id: number, updates: Partial<Customer>): Promise<void> {
    const db = await this.getDB();
    await db.customers.update(id, updates);
  },

  async deleteCustomer(id: number): Promise<void> {
    const db = await this.getDB();
    await db.customers.delete(id);
  },

  async searchCustomers(query: string): Promise<Customer[]> {
    const db = await this.getDB();
    const allCustomers = await db.customers.toArray();
    const searchTerm = query.toLowerCase();
    
    return allCustomers.filter(customer => 
      customer.firstName.toLowerCase().includes(searchTerm) ||
      customer.lastName.toLowerCase().includes(searchTerm) ||
      (customer.email && customer.email.toLowerCase().includes(searchTerm)) ||
      (customer.dni && customer.dni.includes(searchTerm))
    );
  },
};

// Test data initialization
export const initializeTestData = async () => {
  try {
    await database.init();
    
    const existingUsers = await database.getAllUsers();
    if (existingUsers.length === 0) {
      // Create admin user
      await database.addUser({
        username: 'admin',
        fullName: 'Administrador',
        role: 'admin',
        passwordHash: 'admin123',
        email: 'admin@biox.com',
        isActive: true
      });

      // Create test cashier
      await database.addUser({
        username: 'cajero1',
        fullName: 'Cajero Uno',
        role: 'cashier',
        passwordHash: 'cajero123',
        email: 'cajero1@biox.com',
        isActive: true
      });

      console.log('Datos de prueba inicializados correctamente');
    } else {
      console.log('Los datos de prueba ya existen');
    }
  } catch (error) {
    console.info('Los datos de prueba ya existen o hubo un error:', error);
  }
};
