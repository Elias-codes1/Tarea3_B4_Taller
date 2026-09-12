export interface Product {
  id: number;
  nombre: string;
  precio: number;
}

export interface CartItem {
  product: Product;
  cantidad: number;
}
