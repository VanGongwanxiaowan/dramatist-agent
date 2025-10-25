/**
 * SEO优化组件
 * 动态设置页面标题、描述和元标签
 */

import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'profile';
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
}

const SEOHead: React.FC<SEOHeadProps> = ({
  title = 'AI短剧创作工坊 - 专业智能体协作平台',
  description = '基于爆款引擎理论的智能短剧策划与创作平台，提供40+专业AI智能体支持，覆盖从策划到评估的完整创作流程',
  keywords = 'AI短剧,智能体协作,剧本创作,故事分析,角色开发,情节点,IP评估,短剧策划',
  image = '/og-image.jpg',
  url,
  type = 'website',
  author = 'AI短剧创作工坊',
  publishedTime,
  modifiedTime
}) => {
  const location = useLocation();

  useEffect(() => {
    const currentUrl = url || `${window.location.origin}${location.pathname}`;
    
    // 设置页面标题
    document.title = title;
    
    // 更新或创建meta标签
    const updateMetaTag = (name: string, content: string, property?: boolean) => {
      const attribute = property ? 'property' : 'name';
      let meta = document.querySelector(`meta[${attribute}="${name}"]`);
      
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute(attribute, name);
        document.head.appendChild(meta);
      }
      
      meta.setAttribute('content', content);
    };

    // 基础meta标签
    updateMetaTag('description', description);
    updateMetaTag('keywords', keywords);
    updateMetaTag('author', author);
    
    // Open Graph标签
    updateMetaTag('og:title', title, true);
    updateMetaTag('og:description', description, true);
    updateMetaTag('og:image', image, true);
    updateMetaTag('og:url', currentUrl, true);
    updateMetaTag('og:type', type, true);
    updateMetaTag('og:site_name', 'AI短剧创作工坊', true);
    
    // Twitter Card标签
    updateMetaTag('twitter:card', 'summary_large_image');
    updateMetaTag('twitter:title', title);
    updateMetaTag('twitter:description', description);
    updateMetaTag('twitter:image', image);
    
    // 结构化数据
    const structuredData = {
      "@context": "https://schema.org",
      "@type": type === 'article' ? 'Article' : 'WebApplication',
      "name": title,
      "description": description,
      "url": currentUrl,
      "author": {
        "@type": "Organization",
        "name": author
      },
      "applicationCategory": "CreativeWork",
      "operatingSystem": "Web Browser",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "CNY"
      },
      "featureList": [
        "AI短剧策划",
        "智能体协作",
        "故事分析",
        "角色开发",
        "情节点生成",
        "IP价值评估"
      ]
    };

    if (publishedTime) {
      (structuredData as any).datePublished = publishedTime;
    }
    if (modifiedTime) {
      (structuredData as any).dateModified = modifiedTime;
    }

    // 移除旧的structured data
    const oldScript = document.querySelector('script[type="application/ld+json"]');
    if (oldScript) {
      oldScript.remove();
    }

    // 添加新的structured data
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(structuredData);
    document.head.appendChild(script);

    // 设置canonical链接
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', currentUrl);

    // 设置语言
    updateMetaTag('language', 'zh-CN');
    updateMetaTag('robots', 'index, follow');

  }, [title, description, keywords, image, url, type, author, publishedTime, modifiedTime, location.pathname]);

  return null;
};

export default SEOHead;
