
// Base de datos local usando IndexedDB
export interface User {
  id?: number;
  username: string;
  email: string;
  password: string;
  role: 'admin' | 'cashier';
  fullName?: string;
  isActive: boolean;
  createdAt: Date;
}

export interface Product {
  id?: number;
  name: string;
  minStock: number;
  currentStock: number;
  description?: string;
  createdBy: string;
  createdAt: Date;
}

export interface Purchase {
  id?: number;
  productId: number;
  productName: string;
  quantity: number;
  purchasePrice: number;
  description?: string;
  cashierId: number;
  date: Date;
  createdAt: Date;
}

export interface Sale {
  id?: number;
  productId: number;
  productName: string;
  quantity: number;
  salePrice: number;
  total: number;
  cashierId: number;
  date: Date;
  createdAt: Date;
}

export interface ActivityLog {
  id?: number;
  action: string;
  userId: number;
  userRole: 'admin' | 'cashier';
  details?: string;
  date: Date;
  createdAt: Date;
}

class Database {
  private db: IDBDatabase | null = null;
  private readonly dbName = 'BioxPOSDB';
  private readonly version = 2; // Incrementamos la versión para la actualización

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
          const userStore = db.createObjectStore('users', { keyPath: 'id', autoIncrement: true });
          userStore.createIndex('username', 'username', { unique: true });
          userStore.createIndex('email', 'email', { unique: true });
          userStore.createIndex('role', 'role');
          userStore.createIndex('isActive', 'isActive');
        }

        // Tabla de productos
        if (!db.objectStoreNames.contains('products')) {
          const productStore = db.createObjectStore('products', { keyPath: 'id', autoIncrement: true });
          productStore.createIndex('name', 'name');
          productStore.createIndex('currentStock', 'currentStock');
          productStore.createIndex('minStock', 'minStock');
        }

        // Tabla de compras
        if (!db.objectStoreNames.contains('purchases')) {
          const purchaseStore = db.createObjectStore('purchases', { keyPath: 'id', autoIncrement: true });
          purchaseStore.createIndex('cashierId', 'cashierId');
          purchaseStore.createIndex('productId', 'productId');
          purchaseStore.createIndex('date', 'date');
          purchaseStore.createIndex('cashierDate', ['cashierId', 'date']);
        }

        // Tabla de ventas
        if (!db.objectStoreNames.contains('sales')) {
          const saleStore = db.createObjectStore('sales', { keyPath: 'id', autoIncrement: true });
          saleStore.createIndex('cashierId', 'cashierId');
          saleStore.createIndex('productId', 'productId');
          saleStore.createIndex('date', 'date');
          saleStore.createIndex('cashierDate', ['cashierId', 'date']);
        }

        // Tabla de historial de actividades
        if (!db.objectStoreNames.contains('activityLogs')) {
          const logStore = db.createObjectStore('activityLogs', { keyPath: 'id', autoIncrement: true });
          logStore.createIndex('userId', 'userId');
          logStore.createIndex('userRole', 'userRole');
          logStore.createIndex('date', 'date');
          logStore.createIndex('action', 'action');
        }
      };
    });
  }

  // Usuarios
  async addUser(user: Omit<User, 'id' | 'createdAt'>): Promise<number> {
    const newUser: Omit<User, 'id'> = {
      ...user,
      createdAt: new Date()
    };

    const transaction = this.db!.transaction(['users'], 'readwrite');
    const store = transaction.objectStore('users');
    
    return new Promise((resolve, reject) => {
      const request = store.add(newUser);
      request.onsuccess = async () => {
        const userId = request.result as number;
        await this.logActivity('Usuario creado', userId, user.role, `Usuario ${user.username} creado`);
        resolve(userId);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async getUser(username: string, password: string): Promise<User | null> {
    const transaction = this.db!.transaction(['users'], 'readonly');
    const store = transaction.objectStore('users');
    const index = store.index('username');
    
    return new Promise((resolve) => {
      const request = index.get(username);
      request.onsuccess = async () => {
        const user = request.result;
        if (user && user.password === password && user.isActive) {
          await this.logActivity('Inicio de sesión', user.id, user.role, `Usuario ${user.username} inició sesión`);
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

  async updateCashierStatus(userId: number, isActive: boolean): Promise<void> {
    return this.updateUserStatus(userId, isActive);
  }

  async updateUserStatus(userId: number, isActive: boolean): Promise<void> {
    const transaction = this.db!.transaction(['users'], 'readwrite');
    const store = transaction.objectStore('users');
    
    return new Promise((resolve, reject) => {
      const getRequest = store.get(userId);
      getRequest.onsuccess = async () => {
        const user = getRequest.result;
        if (user) {
          user.isActive = isActive;
          const updateRequest = store.put(user);
          updateRequest.onsuccess = async () => {
            await this.logActivity(
              isActive ? 'Usuario activado' : 'Usuario desactivado', 
              userId, 
              'admin', 
              `Usuario ${user.username} ${isActive ? 'activado' : 'desactivado'}`
            );
            resolve();
          };
          updateRequest.onerror = () => reject(updateRequest.error);
        } else {
          reject(new Error('User not found'));
        }
      };
      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  // Productos
  async addProduct(product: Omit<Product, 'id' | 'createdAt'>): Promise<number> {
    const newProduct: Omit<Product, 'id'> = {
      ...product,
      createdAt: new Date()
    };

    const transaction = this.db!.transaction(['products'], 'readwrite');
    const store = transaction.objectStore('products');
    
    return new Promise((resolve, reject) => {
      const request = store.add(newProduct);
      request.onsuccess = async () => {
        const productId = request.result as number;
        await this.logActivity('Producto creado', 1, 'admin', `Producto ${product.name} agregado al inventario`);
        resolve(productId);
      };
      request.onerror = () => reject(request.error);
    });
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

  async updateProduct(productId: number, product: Product): Promise<void> {
    const transaction = this.db!.transaction(['products'], 'readwrite');
    const store = transaction.objectStore('products');
    
    return new Promise((resolve, reject) => {
      const updateRequest = store.put(product);
      updateRequest.onsuccess = async () => {
        await this.logActivity('Producto actualizado', 1, 'admin', `Producto ${product.name} actualizado`);
        resolve();
      };
      updateRequest.onerror = () => reject(updateRequest.error);
    });
  }

  async deleteProduct(productId: number): Promise<void> {
    const transaction = this.db!.transaction(['products'], 'readwrite');
    const store = transaction.objectStore('products');
    
    return new Promise((resolve, reject) => {
      const getRequest = store.get(productId);
      getRequest.onsuccess = async () => {
        const product = getRequest.result;
        const deleteRequest = store.delete(productId);
        deleteRequest.onsuccess = async () => {
          if (product) {
            await this.logActivity('Producto eliminado', 1, 'admin', `Producto ${product.name} eliminado del inventario`);
          }
          resolve();
        };
        deleteRequest.onerror = () => reject(deleteRequest.error);
      };
      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  async updateProductStock(productId: number, quantity: number, operation: 'add' | 'subtract'): Promise<void> {
    const transaction = this.db!.transaction(['products'], 'readwrite');
    const store = transaction.objectStore('products');
    
    return new Promise((resolve, reject) => {
      const getRequest = store.get(productId);
      getRequest.onsuccess = () => {
        const product = getRequest.result;
        if (product) {
          const oldStock = product.currentStock;
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

  async getCriticalStockAlerts(): Promise<Product[]> {
    return this.getLowStockProducts();
  }

  // Compras
  async createPurchase(purchase: Omit<Purchase, 'id' | 'createdAt'>): Promise<number> {
    const newPurchase: Omit<Purchase, 'id'> = {
      ...purchase,
      createdAt: new Date()
    };

    const transaction = this.db!.transaction(['purchases'], 'readwrite');
    const store = transaction.objectStore('purchases');
    
    return new Promise((resolve, reject) => {
      const request = store.add(newPurchase);
      request.onsuccess = async () => {
        const purchaseId = request.result as number;
        // Actualizar stock del producto
        await this.updateProductStock(purchase.productId, purchase.quantity, 'add');
        await this.logActivity(
          'Compra registrada', 
          purchase.cashierId, 
          'cashier', 
          `Compra de ${purchase.quantity} unidades de ${purchase.productName}`
        );
        resolve(purchaseId);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async getPurchasesByUser(cashierId: number): Promise<Purchase[]> {
    const transaction = this.db!.transaction(['purchases'], 'readonly');
    const store = transaction.objectStore('purchases');
    const index = store.index('cashierId');
    
    return new Promise((resolve) => {
      const request = index.getAll(cashierId);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve([]);
    });
  }

  async getPurchasesByDateRange(startDate: Date, endDate: Date, cashierId?: number): Promise<Purchase[]> {
    const transaction = this.db!.transaction(['purchases'], 'readonly');
    const store = transaction.objectStore('purchases');
    
    return new Promise((resolve) => {
      const request = store.getAll();
      request.onsuccess = () => {
        let purchases = request.result.filter(purchase => {
          const purchaseDate = new Date(purchase.date);
          return purchaseDate >= startDate && purchaseDate <= endDate;
        });
        
        if (cashierId) {
          purchases = purchases.filter(purchase => purchase.cashierId === cashierId);
        }
        
        resolve(purchases);
      };
      request.onerror = () => resolve([]);
    });
  }

  // Ventas
  async createSale(sale: Omit<Sale, 'id' | 'createdAt'>): Promise<number> {
    const newSale: Omit<Sale, 'id'> = {
      ...sale,
      createdAt: new Date()
    };

    const transaction = this.db!.transaction(['sales'], 'readwrite');
    const store = transaction.objectStore('sales');
    
    return new Promise((resolve, reject) => {
      const request = store.add(newSale);
      request.onsuccess = async () => {
        const saleId = request.result as number;
        // Reducir stock del producto
        await this.updateProductStock(sale.productId, sale.quantity, 'subtract');
        await this.logActivity(
          'Venta registrada', 
          sale.cashierId, 
          'cashier', 
          `Venta de ${sale.quantity} unidades de ${sale.productName} por $${sale.total}`
        );
        resolve(saleId);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async getSalesByUser(cashierId: number): Promise<Sale[]> {
    const transaction = this.db!.transaction(['sales'], 'readonly');
    const store = transaction.objectStore('sales');
    const index = store.index('cashierId');
    
    return new Promise((resolve) => {
      const request = index.getAll(cashierId);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve([]);
    });
  }

  async getSalesByDateRange(startDate: Date, endDate: Date, cashierId?: number): Promise<Sale[]> {
    const transaction = this.db!.transaction(['sales'], 'readonly');
    const store = transaction.objectStore('sales');
    
    return new Promise((resolve) => {
      const request = store.getAll();
      request.onsuccess = () => {
        let sales = request.result.filter(sale => {
          const saleDate = new Date(sale.date);
          return saleDate >= startDate && saleDate <= endDate;
        });
        
        if (cashierId) {
          sales = sales.filter(sale => sale.cashierId === cashierId);
        }
        
        resolve(sales);
      };
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

  // Historial de actividades
  async logActivity(action: string, userId: number, userRole: 'admin' | 'cashier', details?: string): Promise<void> {
    const activityLog: Omit<ActivityLog, 'id'> = {
      action,
      userId,
      userRole,
      details,
      date: new Date(),
      createdAt: new Date()
    };

    const transaction = this.db!.transaction(['activityLogs'], 'readwrite');
    const store = transaction.objectStore('activityLogs');
    
    return new Promise((resolve) => {
      const request = store.add(activityLog);
      request.onsuccess = () => resolve();
      request.onerror = () => resolve(); // No fallar si no se puede guardar el log
    });
  }

  async getActivityLogs(userId?: number, startDate?: Date, endDate?: Date): Promise<ActivityLog[]> {
    const transaction = this.db!.transaction(['activityLogs'], 'readonly');
    const store = transaction.objectStore('activityLogs');
    
    return new Promise((resolve) => {
      const request = store.getAll();
      request.onsuccess = () => {
        let logs = request.result;
        
        if (userId) {
          logs = logs.filter(log => log.userId === userId);
        }
        
        if (startDate && endDate) {
          logs = logs.filter(log => {
            const logDate = new Date(log.date);
            return logDate >= startDate && logDate <= endDate;
          });
        }
        
        // Ordenar por fecha descendente
        logs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        
        resolve(logs);
      };
      request.onerror = () => resolve([]);
    });
  }
}

export const database = new Database();

// Función para inicializar datos de prueba
export async function initializeTestData(): Promise<void> {
  try {
    // Crear usuarios de prueba
    await database.addUser({
      username: 'admin',
      email: 'admin@biox.com',
      password: 'admin123',
      role: 'admin',
      fullName: 'Administrador Principal',
      isActive: true
    });

    await database.addUser({
      username: 'cajero1',
      email: 'maria@biox.com',
      password: 'cajero123',
      role: 'cashier',
      fullName: 'María González',
      isActive: true
    });

    await database.addUser({
      username: 'cajero2',
      email: 'juan@biox.com',
      password: 'cajero456',
      role: 'cashier',
      fullName: 'Juan Pérez',
      isActive: true
    });

    // Crear productos de prueba
    await database.addProduct({
      name: 'Producto A',
      minStock: 10,
      currentStock: 50,
      description: 'Descripción del producto A',
      createdBy: 'admin'
    });

    await database.addProduct({
      name: 'Producto B',
      minStock: 5,
      currentStock: 3,
      description: 'Descripción del producto B (Stock crítico)',
      createdBy: 'admin'
    });

    await database.addProduct({
      name: 'Producto C',
      minStock: 15,
      currentStock: 8,
      description: 'Descripción del producto C (Stock bajo)',
      createdBy: 'admin'
    });

    console.log('Datos de prueba inicializados correctamente');
  } catch (error) {
    console.log('Los datos de prueba ya existen o hubo un error:', error);
  }
}
