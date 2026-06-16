import React, { createContext, useContext, useState } from 'react';

type Lang = 'ru' | 'en';

const translations = {
  ru: {
    // Nav
    'nav.terminal': 'Терминал',
    'nav.ai': 'ИИ Помощник',
    'nav.find_device': 'Мои устройства',
    'nav.connect': 'Подключение',
    'nav.settings': 'Настройки',
    'nav.subscription': 'Подписка',
    'nav.support': 'Поддержка',
    'nav.faq': 'FAQ',
    'nav.docs': 'Документация',
    // Landing
    'landing.tagline': 'Ваша инфраструктура. Ваш терминал. Ваш ИИ.',
    'landing.hero_sub': 'Веб-терминал с SSH и ИИ-помощником прямо в браузере.',
    'landing.launch': 'Запустить терминал',
    'landing.find_devices': 'Мои устройства',
    'landing.ai_assistant': 'ИИ Помощник',
    'landing.feat1_title': 'Web SSH',
    'landing.feat1_desc': 'Подключайтесь к любому серверу прямо из браузера. Без установки клиента.',
    'landing.feat2_title': 'ИИ Помощник',
    'landing.feat2_desc': 'Claude объясняет вывод команд и предлагает решения.',
    'landing.feat3_title': 'Мои устройства',
    'landing.feat3_desc': 'Сохраняйте свои серверы и подключайтесь в один клик.',
    // Shell
    'shell.connect': 'Подключить',
    'shell.reconnect': 'Переподключить',
    'shell.connecting': 'Подключение...',
    'shell.connected': 'Подключено',
    'shell.disconnected': 'Отключено',
    'shell.idle': 'Ожидание',
    'shell.clear': 'Очистить',
    'shell.copy': 'Копировать',
    'shell.download': 'Скачать лог',
    'shell.ai_toggle': 'Ctrl+Shift+A — ИИ панель',
    // Find Device
    'device.title': 'Мои устройства',
    'device.add': 'Добавить устройство',
    'device.name': 'Название',
    'device.host': 'Хост / IP',
    'device.port': 'Порт',
    'device.user': 'Пользователь',
    'device.connect': 'Подключить',
    'device.edit': 'Изменить',
    'device.delete': 'Удалить',
    'device.empty': 'Устройства не добавлены. Нажмите «Добавить» чтобы начать.',
    'device.search': 'Поиск...',
    // Subscription
    'sub.title': 'Тарифы и цены',
    'sub.subtitle': 'Начните бесплатно. Обновите когда нужно.',
    'sub.free_cta': 'Начать бесплатно',
    'sub.pro_cta': 'Оплатить криптой',
    'sub.ent_cta': 'Написать нам',
    'sub.popular': 'ПОПУЛЯРНО',
    'sub.footer': 'Оплата криптой (BTC/ETH/USDT), PayPal или банковским переводом (Wise).',
    // Support
    'support.title': 'Поддержка',
    'support.contact': 'Связаться',
    'support.status': 'Все системы работают',
    // AI
    'ai.placeholder': 'Спросите ИИ…',
    'ai.send': 'Отправить',
    'ai.context': 'Последние 20 строк терминала используются как контекст.',
    // General
    'footer.terms': 'Условия',
    'footer.policy': 'Конфиденциальность',
    'footer.faq': 'FAQ',
    'footer.support': 'Поддержка',
    'footer.copy': '© 2026 SIPA OS',
  },
  en: {
    'nav.terminal': 'Terminal',
    'nav.ai': 'AI Assistant',
    'nav.find_device': 'My Devices',
    'nav.connect': 'Connect',
    'nav.settings': 'Settings',
    'nav.subscription': 'Subscription',
    'nav.support': 'Support',
    'nav.faq': 'FAQ',
    'nav.docs': 'Docs',
    'landing.tagline': 'Your infrastructure. Your terminal. Your AI.',
    'landing.hero_sub': 'Web SSH terminal with AI assistant, right in your browser.',
    'landing.launch': 'Launch Terminal',
    'landing.find_devices': 'My Devices',
    'landing.ai_assistant': 'AI Assistant',
    'landing.feat1_title': 'Web SSH',
    'landing.feat1_desc': 'Connect to any server from your browser. No client install.',
    'landing.feat2_title': 'AI Assistant',
    'landing.feat2_desc': 'Claude explains command output and suggests fixes.',
    'landing.feat3_title': 'My Devices',
    'landing.feat3_desc': 'Save your servers and connect in one click.',
    'shell.connect': 'Connect',
    'shell.reconnect': 'Reconnect',
    'shell.connecting': 'Connecting...',
    'shell.connected': 'Connected',
    'shell.disconnected': 'Disconnected',
    'shell.idle': 'Idle',
    'shell.clear': 'Clear',
    'shell.copy': 'Copy',
    'shell.download': 'Download log',
    'shell.ai_toggle': 'Ctrl+Shift+A — AI panel',
    'device.title': 'My Devices',
    'device.add': 'Add Device',
    'device.name': 'Name',
    'device.host': 'Host / IP',
    'device.port': 'Port',
    'device.user': 'Username',
    'device.connect': 'Connect',
    'device.edit': 'Edit',
    'device.delete': 'Delete',
    'device.empty': 'No devices added yet. Click "Add Device" to get started.',
    'device.search': 'Search...',
    'sub.title': 'Plans & Pricing',
    'sub.subtitle': "Start free. Upgrade when you're ready.",
    'sub.free_cta': 'Get Started',
    'sub.pro_cta': 'Pay with Crypto',
    'sub.ent_cta': 'Contact Us',
    'sub.popular': 'MOST POPULAR',
    'sub.footer': 'Pay with crypto (BTC/ETH/USDT), PayPal, or bank transfer via Wise.',
    'support.title': 'Support',
    'support.contact': 'Contact',
    'support.status': 'All systems operational',
    'ai.placeholder': 'Ask the AI…',
    'ai.send': 'Send',
    'ai.context': 'Last 20 terminal lines used as context.',
    'footer.terms': 'Terms',
    'footer.policy': 'Privacy',
    'footer.faq': 'FAQ',
    'footer.support': 'Support',
    'footer.copy': '© 2026 SIPA OS',
  },
} as const;

type TranslationKey = keyof typeof translations.ru;
interface LangContextType { lang: Lang; t: (key: TranslationKey) => string; toggle: () => void; }

const LangContext = createContext<LangContextType>({ lang: 'ru', t: (k) => k, toggle: () => {} });

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Lang>(() =>
    (localStorage.getItem('sipa_lang') as Lang) || 'ru'
  );
  const toggle = () => {
    const next: Lang = lang === 'ru' ? 'en' : 'ru';
    localStorage.setItem('sipa_lang', next);
    setLang(next);
  };
  const t = (key: TranslationKey) => translations[lang][key] ?? key;
  return <LangContext.Provider value={{ lang, t, toggle }}>{children}</LangContext.Provider>;
}

export const useLang = () => useContext(LangContext);
