import React, { useState, useEffect } from 'react';
import { Product, ProductVariant, Address } from '../types/product';

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

  return (
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
            <button className="btn-primary mt-8">
              Adicionar ao Carrinho
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductPage;
