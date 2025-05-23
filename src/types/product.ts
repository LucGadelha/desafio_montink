export interface CartItemVariant {
  variantId: string;
  variantName: string;
  valueId: string;
  valueName: string;
}

export interface CartItem {
  id: string;
  productId: string;
  title: string;
  price: number;
  quantity: number;
  image: string;
  variants: CartItemVariant[];
}

export interface ProductVariant {
  id: string;
  name: string;
  values: {
    id: string;
    name: string;
    available: boolean;
  }[];
}

export interface ProductImage {
  id: string;
  url: string;
  alt: string;
}

export interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  originalPrice?: number;
  images: ProductImage[];
  variants: ProductVariant[];
}

export interface Address {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  erro?: boolean;
}
