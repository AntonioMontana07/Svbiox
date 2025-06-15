import Dexie, { Table } from 'dexie';

export interface Product {
  id?: number;
  name: string;
  description: string;
  imageUrl: string;
  price: number;
  currentStock: number;
}

export interface User {
  id?: number;
  username: string;
  fullName: string;
  role: 'admin' | 'cashier';
  passwordHash: string;
}

export interface Sale {
  id?: number;
  productId: number;
  productName: string;
  quantity: number;
  salePrice: number;
  subtotal: number; // Nuevo: precio sin IGV
  igv: number; // Nuevo: monto del IGV
  total: number;
  paymentMethod: 'efectivo' | 'tarjeta' | 'yape'; // Nuevo
  amountReceived?: number; // Nuevo: solo para efectivo
  change?: number; // Nuevo: vuelto para efectivo
  cashierId: number;
  date: Date;
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

export class MyDatabase extends Dexie {
  products!: Table<Product>;
  users!: Table<User>;
  sales!: Table<Sale>;
  inventoryLogs!: Table<InventoryLog>;
  suppliers!: Table<Supplier>;

  constructor() {
    super('BioxDB');
    this.version(3).stores({
      products: '++id, name, price, currentStock',
      users: '++id, username, fullName, role, passwordHash',
      sales: '++id, productId, productName, quantity, salePrice, total, cashierId, date',
      inventoryLogs: '++id, productId, productName, date, changeInStock, newStockLevel, description',
      suppliers: '++id, name, contactName, contactEmail, contactPhone, address'
    });
  }
}

export const database = {
  db: null as MyDatabase | null,

  async getDB(): Promise<MyDatabase> {
    if (!this.db) {
      this.db = new MyDatabase();
      await this.db.open();
    }
    return this.db;
  },

  async createProduct(product: Omit<Product, 'id'>): Promise<number> {
    const db = await this.getDB();
    return await db.products.add(product);
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

  async createUser(user: Omit<User, 'id'>): Promise<number> {
    const db = await this.getDB();
    return await db.users.add(user);
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

  async updateUser(id: number, updates: Partial<User>): Promise<void> {
    const db = await this.getDB();
    await db.users.update(id, updates);
  },

  async deleteUser(id: number): Promise<void> {
    const db = await this.getDB();
    await db.users.delete(id);
  },

  async createSale(sale: Omit<Sale, 'id' | 'subtotal' | 'igv' | 'change'>): Promise<number> {
    const db = await this.getDB();
    
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
    
    const transaction = db.transaction(['sales', 'products'], 'readwrite');
    const salesStore = transaction.objectStore('sales');
    const productsStore = transaction.objectStore('products');
    
    // Crear la venta
    const request = salesStore.add(saleData);
    const saleId = await new Promise<number>((resolve, reject) => {
      request.onsuccess = () => resolve(request.result as number);
      request.onerror = () => reject(request.error);
    });
    
    // Actualizar el stock del producto
    const product = await this.getProductById(sale.productId);
    if (product) {
      product.currentStock -= sale.quantity;
      await new Promise<void>((resolve, reject) => {
        const updateRequest = productsStore.put(product);
        updateRequest.onsuccess = () => resolve();
        updateRequest.onerror = () => reject(updateRequest.error);
      });
    }
    
    return saleId;
  },

  async getSalesByUser(userId: number): Promise<Sale[]> {
    const db = await this.getDB();
    return await db.sales.where({ cashierId: userId }).toArray();
  },

  async deleteSale(saleId: number): Promise<void> {
    const db = await this.getDB();
    
    // Primero obtener la venta para restaurar el stock
    const sale = await this.getSaleById(saleId);
    if (sale) {
      const product = await this.getProductById(sale.productId);
      if (product) {
        // Restaurar el stock
        product.currentStock += sale.quantity;
        const transaction = db.transaction(['products'], 'readwrite');
        const productsStore = transaction.objectStore('products');
        await new Promise<void>((resolve, reject) => {
          const updateRequest = productsStore.put(product);
          updateRequest.onsuccess = () => resolve();
          updateRequest.onerror = () => reject(updateRequest.error);
        });
      }
    }
    
    // Eliminar la venta
    const transaction = db.transaction(['sales'], 'readwrite');
    const salesStore = transaction.objectStore('sales');
    
    return new Promise<void>((resolve, reject) => {
      const request = salesStore.delete(saleId);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },

  async createInventoryLog(log: Omit<InventoryLog, 'id'>): Promise<number> {
    const db = await this.getDB();
    return await db.inventoryLogs.add(log);
  },

  async getInventoryLogsByProduct(productId: number): Promise<InventoryLog[]> {
    const db = await this.getDB();
    return await db.inventoryLogs.where({ productId: productId }).toArray();
  },

  async getSaleById(saleId: number): Promise<Sale | null> {
    const db = await this.getDB();
    const transaction = db.transaction(['sales'], 'readonly');
    const salesStore = transaction.objectStore('sales');
    
    return new Promise<Sale | null>((resolve, reject) => {
      const request = salesStore.get(saleId);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  },

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
};
