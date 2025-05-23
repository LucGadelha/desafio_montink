import React, { useState, useEffect } from 'react';
import { Product, Address, CartItem } from '../types/product';
import { FiShoppingCart, FiX, FiPlus, FiMinus } from 'react-icons/fi';

// Criando componentes de ícone com tipagem correta
const CartIcon = () => <FiShoppingCart style={{ width: 24, height: 24 }} />;
const CloseIcon = () => <FiX style={{ width: 24, height: 24 }} />;
const PlusIcon = () => <FiPlus style={{ width: 16, height: 16 }} />;
const MinusIcon = () => <FiMinus style={{ width: 16, height: 16 }} />;

// Function to get image URL with fallback to placeholder
const getImageUrl = (color: string, width = 600, height = 400) => {
  try {
    // Try to load the image from the public directory
    const imagePath = `/assets/images/produto/Modelo_em_${color}.png`;
    // This will be replaced by the actual image if it exists
    return imagePath;
  } catch (error) {
    // Fallback to placeholder service if the image doesn't exist
    return `https://via.placeholder.com/${width}x${height}?text=${encodeURIComponent(color)}`;
  }
};

// Image paths with fallback to placeholder service
const IMAGES = {
  BRANCO: getImageUrl('Branco'),
  PRETO: getImageUrl('Preto'),
  VERDE: getImageUrl('Verde')
};

// Mock product data
const mockProduct: Product = {
  id: '1',
  title: 'Tênis Esportivo de Alta Performance',
  description: 'Tênis ideal para corridas e treinos de alta intensidade com tecnologia de amortecimento avançada.',
  price: 349.99,
  originalPrice: 429.99,
  images: [
    {
      id: 'img1',
      url: IMAGES.BRANCO,
      alt: 'Tênis Branco'
    },
    {
      id: 'img2',
      url: IMAGES.PRETO,
      alt: 'Tênis Preto'
    },
    {
      id: 'img5',
      url: IMAGES.VERDE,
      alt: 'Tênis Verde'
    },
  ],
  variants: [
    {
      id: 'size',
      name: 'Tamanho',
      values: [
        { id: '36', name: '36', available: true },
        { id: '37', name: '37', available: true },
        { id: '38', name: '38', available: true },
        { id: '39', name: '39', available: false },
        { id: '40', name: '40', available: true },
        { id: '41', name: '41', available: true },
        { id: '42', name: '42', available: true },
      ]
    },
    {
      id: 'color',
      name: 'Cor',
      values: [
        { id: 'black', name: 'Preto', available: true },
        { id: 'white', name: 'Branco', available: true },
        { id: 'green', name: 'Verde', available: true },
        { id: 'red', name: 'Vermelho', available: false },
      ]
    }
  ]
};

const ProductPage: React.FC = () => {
  const [product, setProduct] = useState<Product>(mockProduct);
  const [selectedImage, setSelectedImage] = useState<string>(
    mockProduct.images && mockProduct.images.length > 0 ? mockProduct.images[0].url : ''
  );
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});
  const [cep, setCep] = useState<string>('');
  const [address, setAddress] = useState<Address | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [cart, setCart] = useState<CartItem[]>(() => {
    const savedCart = localStorage.getItem('cart');
    return savedCart ? JSON.parse(savedCart) : [];
  });
  const [showCart, setShowCart] = useState<boolean>(false);
  const [showNotification, setShowNotification] = useState<boolean>(false);
  const [notificationMessage, setNotificationMessage] = useState<string>('');

  // Load saved state from localStorage on component mount
  useEffect(() => {
    try {
      const savedState = localStorage.getItem('productPageState');
      if (savedState) {
        const parsed = JSON.parse(savedState);
        const now = new Date().getTime();
        
        // Check if the saved state has the correct format and is less than 15 minutes old
        if (parsed && parsed.timestamp && parsed.state && (now - parsed.timestamp < 15 * 60 * 1000)) {
          const { state } = parsed;
          
          // Safely update state only if the values exist
          if (state.selectedVariants) {
            setSelectedVariants(state.selectedVariants);
          }
          
          if (state.cep) {
            setCep(state.cep);
          }
          
          if (state.address) {
            setAddress(state.address);
          }
          
          if (state.selectedImage) {
            setSelectedImage(state.selectedImage);
          }
        } else {
          // Clear expired or invalid state
          localStorage.removeItem('productPageState');
        }
      }
    } catch (error) {
      console.error('Error loading saved state:', error);
      // Clear corrupted state
      localStorage.removeItem('productPageState');
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    try {
      const stateToSave = {
        timestamp: new Date().getTime(),
        state: {
          selectedVariants: selectedVariants || {},
          cep: cep || '',
          address: address || null,
          selectedImage: selectedImage || mockProduct.images[0]?.url || ''
        }
      };
      localStorage.setItem('productPageState', JSON.stringify(stateToSave));
    } catch (error) {
      console.error('Error saving state to localStorage:', error);
    }
  }, [selectedVariants, cep, address, selectedImage]);

  const handleVariantSelect = (variantId: string, valueId: string) => {
    setSelectedVariants(prev => ({
      ...prev,
      [variantId]: valueId
    }));
  };

  const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    if (value.length <= 8) {
      setCep(value);
    }
  };

  const handleCepBlur = async () => {
    if (cep.length === 8) {
      setLoading(true);
      setError('');
      
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
        const data: Address = await response.json();
        
        if (data.erro) {
          setError('CEP não encontrado');
          setAddress(null);
        } else {
          setAddress(data);
        }
      } catch (err) {
        console.error('Erro ao buscar CEP:', err);
        setError('Erro ao buscar CEP. Tente novamente.');
        setAddress(null);
      } finally {
        setLoading(false);
      }
    }
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };

  const isVariantSelected = (variantId: string, valueId: string) => {
    return selectedVariants[variantId] === valueId;
  };

  const isVariantAvailable = (variantId: string, valueId: string) => {
    const variant = product.variants.find(v => v.id === variantId);
    if (!variant) return false;
    const value = variant.values.find(v => v.id === valueId);
    return value ? value.available : false;
  };

  const addToCart = () => {
    // Verificar se todas as variantes necessárias foram selecionadas
    const missingVariants = product.variants.filter(
      variant => !selectedVariants[variant.id]
    );

    if (missingVariants.length > 0) {
      setNotificationMessage(`Por favor, selecione ${missingVariants.map(v => v.name).join(' e ')}`);
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 3000);
      return;
    }

    // Criar o item do carrinho
    const cartItem: CartItem = {
      id: `${product.id}-${Object.values(selectedVariants).join('-')}`,
      productId: product.id,
      title: product.title,
      price: product.price,
      quantity: 1,
      image: selectedImage || product.images[0]?.url || '',
      variants: Object.entries(selectedVariants).map(([variantId, valueId]) => {
        const variant = product.variants.find(v => v.id === variantId);
        const value = variant?.values.find(v => v.id === valueId);
        return {
          variantId,
          variantName: variant?.name || '',
          valueId,
          valueName: value?.name || ''
        };
      })
    };

    // Verificar se o item já está no carrinho
    const existingItemIndex = cart.findIndex(item => 
      item.id === cartItem.id
    );

    if (existingItemIndex >= 0) {
      // Se o item já existe, incrementar a quantidade
      const updatedCart = [...cart];
      updatedCart[existingItemIndex].quantity += 1;
      setCart(updatedCart);
    } else {
      // Se não existe, adicionar novo item
      setCart([...cart, cartItem]);
    }

    // Mostrar notificação
    setNotificationMessage('Produto adicionado ao carrinho!');
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 3000);
  };

  const updateQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    
    setCart(cart.map(item => 
      item.id === itemId ? { ...item, quantity: newQuantity } : item
    ));
  };

  const removeFromCart = (itemId: string) => {
    setCart(cart.filter(item => item.id !== itemId));
  };

  const getTotalItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  const getTotalPrice = (): number => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  // Adicionando estilos CSS inline para a animação
  const animationStyles = `
    @keyframes fadeInOut {
      0% { opacity: 0; transform: translateY(10px); }
      10% { opacity: 1; transform: translateY(0); }
      90% { opacity: 1; transform: translateY(0); }
      100% { opacity: 0; transform: translateY(-10px); }
    }
    .animate-fade-in-out {
      animation: fadeInOut 3s ease-in-out forwards;
    }
  `;

  return (
    <>
      <style>{animationStyles}</style>
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="md:flex">
          {/* Product Images */}
          <div className="md:w-1/2 p-6">
            <div className="mb-4">
              {selectedImage ? (
                <img 
                  src={selectedImage} 
                  alt={product.images?.find(img => img.url === selectedImage)?.alt || 'Produto'}
                  className="product-image"
                  onError={(e) => {
                    // Fallback to first available image if selected image fails to load
                    const fallbackImage = product.images?.[0]?.url;
                    if (fallbackImage && fallbackImage !== selectedImage) {
                      setSelectedImage(fallbackImage);
                    } else {
                      // If no fallback, show a placeholder
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = 'https://via.placeholder.com/600x400?text=Imagem+Indisponível';
                    }
                  }}
                />
              ) : (
                <div className="w-full h-64 bg-gray-200 flex items-center justify-center rounded-lg">
                  <span className="text-gray-500">Imagem não disponível</span>
                </div>
              )}
            </div>
            {product.images && product.images.length > 0 ? (
              <div className="flex space-x-2 overflow-x-auto pb-2">
                {product.images.map((image) => (
                  <div key={image.id} className="flex-shrink-0">
                    <img
                      src={image.url}
                      alt={image.alt}
                      className={`thumbnail ${selectedImage === image.url ? 'active' : ''}`}
                      onClick={() => setSelectedImage(image.url)}
                      onError={(e) => {
                        // Hide broken thumbnails
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          {/* Product Info */}
          <div className="md:w-1/2 p-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.title}</h1>
            
            <div className="flex items-center mb-4">
              <span className="text-2xl font-bold text-gray-900">
                {formatPrice(product.price)}
              </span>
              {product.originalPrice && (
                <span className="ml-2 text-lg text-gray-500 line-through">
                  {formatPrice(product.originalPrice)}
                </span>
              )}
              {product.originalPrice && (
                <span className="ml-2 bg-red-100 text-red-800 text-sm font-medium px-2.5 py-0.5 rounded">
                  {Math.round((1 - product.price / product.originalPrice) * 100)}% OFF
                </span>
              )}
            </div>

            <p className="text-gray-700 mb-6">{product.description}</p>

            {/* Product Variants */}
            {product.variants.map((variant) => (
              <div key={variant.id} className="mb-6">
                <h3 className="text-sm font-medium text-gray-900 mb-2">{variant.name}</h3>
                <div className="flex flex-wrap">
                  {variant.values.map((value) => (
                    <button
                      key={value.id}
                      type="button"
                      className={`variant-btn ${
                        isVariantSelected(variant.id, value.id) ? 'selected' : ''
                      } ${
                        !value.available ? 'opacity-50 cursor-not-allowed' : 'hover:border-gray-400'
                      }`}
                      onClick={() => handleVariantSelect(variant.id, value.id)}
                      disabled={!value.available}
                      title={!value.available ? 'Indisponível' : ''}
                    >
                      {value.name}
                    </button>
                  ))}
                </div>
              </div>
            ))}

            {/* Shipping Calculator */}
            <div className="mt-8 border-t border-gray-200 pt-6">
              <h3 className="text-sm font-medium text-gray-900 mb-2">Calcular frete</h3>
              <div className="flex">
                <input
                  type="text"
                  value={cep}
                  onChange={handleCepChange}
                  onBlur={handleCepBlur}
                  placeholder="Digite seu CEP"
                  className="flex-1 border border-gray-300 rounded-l-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  maxLength={9}
                />
                <button
                  onClick={handleCepBlur}
                  disabled={cep.length !== 8 || loading}
                  className="bg-blue-600 text-white px-4 py-2 rounded-r-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                >
                  {loading ? 'Buscando...' : 'OK'}
                </button>
              </div>
              
              {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
              
              {address && !error && (
                <div className="mt-4 p-3 bg-green-50 text-green-800 text-sm rounded-md">
                  <p>Frete para {address.logradouro}, {address.bairro}</p>
                  <p>{address.localidade} - {address.uf}</p>
                  <p className="mt-1 font-medium">Frete grátis para sua região</p>
                </div>
              )}
            </div>

            {/* Add to Cart Button */}
            <button 
              className="btn-primary mt-8 w-full py-3 text-lg font-medium"
              onClick={addToCart}
            >
              Adicionar ao Carrinho
            </button>
            
            {/* Botão do carrinho flutuante */}
            <button 
              onClick={() => setShowCart(true)}
              className="fixed bottom-6 right-6 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-colors z-50 flex items-center justify-center"
              aria-label="Ver carrinho"
            >
              <CartIcon />
              {cart.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center">
                  {getTotalItems()}
                </span>
              )}
            </button>
            
            {/* Notificação */}
            {showNotification && (
              <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center z-50 animate-fade-in-out">
                <span>{notificationMessage}</span>
              </div>
            )}
            
            {/* Carrinho flutuante */}
            {showCart && (
              <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-end">
                <div className="bg-white w-full max-w-md h-full overflow-y-auto">
                  <div className="p-4 border-b flex justify-between items-center">
                    <h2 className="text-xl font-bold">Meu Carrinho</h2>
                    <button 
                      onClick={() => setShowCart(false)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <CloseIcon />
                    </button>
                  </div>
                  
                  {cart.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                      <p>Seu carrinho está vazio</p>
                      <button 
                        onClick={() => setShowCart(false)}
                        className="mt-4 text-blue-600 hover:underline"
                      >
                        Continuar comprando
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="divide-y">
                        {cart.map(item => (
                          <div key={item.id} className="p-4 border-b">
                            <div className="flex">
                              <img 
                                src={item.image} 
                                alt={item.title} 
                                className="w-20 h-20 object-cover rounded"
                              />
                              <div className="ml-4 flex-1">
                                <h3 className="font-medium">{item.title}</h3>
                                {item.variants.map((v, i) => (
                                  <p key={i} className="text-sm text-gray-500">
                                    {v.variantName}: {v.valueName}
                                  </p>
                                ))}
                                <div className="flex items-center mt-2">
                                  <button 
                                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                    className="text-gray-500 hover:text-gray-700"
                                  >
                                    <MinusIcon />
                                  </button>
                                  <span className="mx-2">{item.quantity}</span>
                                  <button 
                                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                    className="text-gray-500 hover:text-gray-700"
                                  >
                                    <PlusIcon />
                                  </button>
                                  <button 
                                    onClick={() => removeFromCart(item.id)}
                                    className="ml-auto text-red-500 hover:text-red-700 text-sm"
                                  >
                                    Remover
                                  </button>
                                </div>
                                <p className="text-right font-medium mt-1">
                                  {formatPrice(item.price * item.quantity)}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      <div className="p-4 border-t">
                        <div className="flex justify-between text-lg font-bold mb-4">
                          <span>Total:</span>
                          <span>{formatPrice(getTotalPrice())}</span>
                        </div>
                        <button 
                          className="w-full bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 transition-colors"
                          onClick={() => alert('Finalizar compra')}
                        >
                          Finalizar Compra
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
    </>
  );
};

export default ProductPage;
