
// Base de datos local usando IndexedDB
export interface User {
  id: string;
  username: string;
  password: string;
  role: 'admin' | 'cashier';
  isActive: boolean;
  createdAt: Date;
}

export interface Product {
  id: string;
  name: string;
  minStock: number;
  currentStock: number;
  description?: string;
  createdBy: string;
  createdAt: Date;
}

export interface Purchase {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  purchasePrice: number;
  description?: string;
  cashierId: string;
  createdAt: Date;
}

export interface Sale {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  salePrice: number;
  total: number;
  cashierId: string;
  createdAt: Date;
}

class Database {
  private db: IDBDatabase | null = null;
  private readonly dbName = 'BioxPOSDB';
  private readonly version = 1;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Tabla de usuarios
        if (!db.objectStoreNames.contains('users')) {
          const userStore = db.createObjectStore('users', { keyPath: 'id' });
          userStore.createIndex('username', 'username', { unique: true });
        }

        // Tabla de productos
        if (!db.objectStoreNames.contains('products')) {
          const productStore = db.createObjectStore('products', { keyPath: 'id' });
          productStore.createIndex('name', 'name');
        }

        // Tabla de compras
        if (!db.objectStoreNames.contains('purchases')) {
          const purchaseStore = db.createObjectStore('purchases', { keyPath: 'id' });
          purchaseStore.createIndex('cashierId', 'cashierId');
          purchaseStore.createIndex('productId', 'productId');
        }

        // Tabla de ventas
        if (!db.objectStoreNames.contains('sales')) {
          const saleStore = db.createObjectStore('sales', { keyPath: 'id' });
          saleStore.createIndex('cashierId', 'cashierId');
          saleStore.createIndex('productId', 'productId');
        }
      };
    });
  }

  // Usuarios
  async createUser(user: Omit<User, 'id' | 'createdAt'>): Promise<string> {
    const id = crypto.randomUUID();
    const newUser: User = {
      ...user,
      id,
      createdAt: new Date()
    };

    const transaction = this.db!.transaction(['users'], 'readwrite');
    const store = transaction.objectStore('users');
    await store.add(newUser);
    return id;
  }

  async getUser(username: string, password: string): Promise<User | null> {
    const transaction = this.db!.transaction(['users'], 'readonly');
    const store = transaction.objectStore('users');
    const index = store.index('username');
    
    return new Promise((resolve) => {
      const request = index.get(username);
      request.onsuccess = () => {
        const user = request.result;
        if (user && user.password === password && user.isActive) {
          resolve(user);
        } else {
          resolve(null);
        }
      };
      request.onerror = () => resolve(null);
    });
  }

  async getAllCashiers(): Promise<User[]> {
    const transaction = this.db!.transaction(['users'], 'readonly');
    const store = transaction.objectStore('users');
    
    return new Promise((resolve) => {
      const request = store.getAll();
      request.onsuccess = () => {
        const users = request.result.filter(user => user.role === 'cashier');
        resolve(users);
      };
      request.onerror = () => resolve([]);
    });
  }

  async updateUserStatus(userId: string, isActive: boolean): Promise<void> {
    const transaction = this.db!.transaction(['users'], 'readwrite');
    const store = transaction.objectStore('users');
    
    return new Promise((resolve, reject) => {
      const getRequest = store.get(userId);
      getRequest.onsuccess = () => {
        const user = getRequest.result;
        if (user) {
          user.isActive = isActive;
          const updateRequest = store.put(user);
          updateRequest.onsuccess = () => resolve();
          updateRequest.onerror = () => reject(updateRequest.error);
        } else {
          reject(new Error('User not found'));
        }
      };
      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  // Productos
  async createProduct(product: Omit<Product, 'id' | 'createdAt'>): Promise<string> {
    const id = crypto.randomUUID();
    const newProduct: Product = {
      ...product,
      id,
      createdAt: new Date()
    };

    const transaction = this.db!.transaction(['products'], 'readwrite');
    const store = transaction.objectStore('products');
    await store.add(newProduct);
    return id;
  }

  async getAllProducts(): Promise<Product[]> {
    const transaction = this.db!.transaction(['products'], 'readonly');
    const store = transaction.objectStore('products');
    
    return new Promise((resolve) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve([]);
    });
  }

  async updateProductStock(productId: string, quantity: number, operation: 'add' | 'subtract'): Promise<void> {
    const transaction = this.db!.transaction(['products'], 'readwrite');
    const store = transaction.objectStore('products');
    
    return new Promise((resolve, reject) => {
      const getRequest = store.get(productId);
      getRequest.onsuccess = () => {
        const product = getRequest.result;
        if (product) {
          if (operation === 'add') {
            product.currentStock += quantity;
          } else {
            product.currentStock = Math.max(0, product.currentStock - quantity);
          }
          const updateRequest = store.put(product);
          updateRequest.onsuccess = () => resolve();
          updateRequest.onerror = () => reject(updateRequest.error);
        } else {
          reject(new Error('Product not found'));
        }
      };
      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  async getLowStockProducts(): Promise<Product[]> {
    const products = await this.getAllProducts();
    return products.filter(product => product.currentStock <= product.minStock);
  }

  // Compras
  async createPurchase(purchase: Omit<Purchase, 'id' | 'createdAt'>): Promise<string> {
    const id = crypto.randomUUID();
    const newPurchase: Purchase = {
      ...purchase,
      id,
      createdAt: new Date()
    };

    const transaction = this.db!.transaction(['purchases'], 'readwrite');
    const store = transaction.objectStore('purchases');
    await store.add(newPurchase);
    
    // Actualizar stock del producto
    await this.updateProductStock(purchase.productId, purchase.quantity, 'add');
    
    return id;
  }

  async getPurchasesByUser(cashierId: string): Promise<Purchase[]> {
    const transaction = this.db!.transaction(['purchases'], 'readonly');
    const store = transaction.objectStore('purchases');
    const index = store.index('cashierId');
    
    return new Promise((resolve) => {
      const request = index.getAll(cashierId);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve([]);
    });
  }

  // Ventas
  async createSale(sale: Omit<Sale, 'id' | 'createdAt'>): Promise<string> {
    const id = crypto.randomUUID();
    const newSale: Sale = {
      ...sale,
      id,
      createdAt: new Date()
    };

    const transaction = this.db!.transaction(['sales'], 'readwrite');
    const store = transaction.objectStore('sales');
    await store.add(newSale);
    
    // Reducir stock del producto
    await this.updateProductStock(sale.productId, sale.quantity, 'subtract');
    
    return id;
  }

  async getSalesByUser(cashierId: string): Promise<Sale[]> {
    const transaction = this.db!.transaction(['sales'], 'readonly');
    const store = transaction.objectStore('sales');
    const index = store.index('cashierId');
    
    return new Promise((resolve) => {
      const request = index.getAll(cashierId);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve([]);
    });
  }

  async getAllSales(): Promise<Sale[]> {
    const transaction = this.db!.transaction(['sales'], 'readonly');
    const store = transaction.objectStore('sales');
    
    return new Promise((resolve) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve([]);
    });
  }

  async getAllPurchases(): Promise<Purchase[]> {
    const transaction = this.db!.transaction(['purchases'], 'readonly');
    const store = transaction.objectStore('purchases');
    
    return new Promise((resolve) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve([]);
    });
  }
}

export const database = new Database();

// Función para inicializar datos de prueba
export async function initializeTestData(): Promise<void> {
  try {
    // Crear usuarios de prueba
    await database.createUser({
      username: 'admin',
      password: 'admin123',
      role: 'admin',
      isActive: true
    });

    await database.createUser({
      username: 'cajero1',
      password: 'cajero123',
      role: 'cashier',
      isActive: true
    });

    await database.createUser({
      username: 'cajero2',
      password: 'cajero456',
      role: 'cashier',
      isActive: true
    });

    // Crear productos de prueba
    await database.createProduct({
      name: 'Producto A',
      minStock: 10,
      currentStock: 50,
      description: 'Descripción del producto A',
      createdBy: 'admin'
    });

    await database.createProduct({
      name: 'Producto B',
      minStock: 5,
      currentStock: 3,
      description: 'Descripción del producto B',
      createdBy: 'admin'
    });

    console.log('Datos de prueba inicializados correctamente');
  } catch (error) {
    console.log('Los datos de prueba ya existen o hubo un error:', error);
  }
}
