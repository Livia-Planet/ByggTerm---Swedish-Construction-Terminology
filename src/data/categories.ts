import { CategoryId, Language } from '../types';

export interface CategoryInfo {
  id: CategoryId;
  name: Record<Language, string>;
  nameSv: string;
  nameZh: string;
  nameEn: string;
  icon: string;
  color: string;
  bgLight: string;
  bg: string;
  text: string;
  border: string;
}

export const CATEGORIES: Record<CategoryId, CategoryInfo> = {
  tools: {
    id: 'tools',
    name: {
      sv: 'Verktyg & Utrustning',
      zh: '工具与装备',
      en: 'Tools & Equipment',
    },
    nameSv: 'Verktyg & Utrustning',
    nameZh: '工具与装备',
    nameEn: 'Tools & Equipment',
    icon: '🛠️',
    color: 'text-amber-700',
    bgLight: 'bg-amber-50',
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    border: 'border-amber-200',
  },
  materials: {
    id: 'materials',
    name: {
      sv: 'Material & Konstruktion',
      zh: '材料与结构',
      en: 'Materials & Structure',
    },
    nameSv: 'Material & Konstruktion',
    nameZh: '材料与结构',
    nameEn: 'Materials & Structure',
    icon: '🧱',
    color: 'text-emerald-700',
    bgLight: 'bg-emerald-50',
    bg: 'bg-emerald-50',
    text: 'text-emerald-800',
    border: 'border-emerald-200',
  },
  safety: {
    id: 'safety',
    name: {
      sv: 'Säkerhet & Arbetsmiljö',
      zh: '安全与环境',
      en: 'Safety & Environment',
    },
    nameSv: 'Säkerhet & Arbetsmiljö',
    nameZh: '安全与环境',
    nameEn: 'Safety & Environment',
    icon: '⚠️',
    color: 'text-rose-700',
    bgLight: 'bg-rose-50',
    bg: 'bg-rose-50',
    text: 'text-rose-800',
    border: 'border-rose-200',
  },
  rules: {
    id: 'rules',
    name: {
      sv: 'Regler & Administration',
      zh: '规范与行政',
      en: 'Rules & Administration',
    },
    nameSv: 'Regler & Administration',
    nameZh: '规范与行政',
    nameEn: 'Rules & Administration',
    icon: '📋',
    color: 'text-sky-700',
    bgLight: 'bg-sky-50',
    bg: 'bg-sky-50',
    text: 'text-sky-800',
    border: 'border-sky-200',
  },
  methods: {
    id: 'methods',
    name: {
      sv: 'Byggmetoder & Processer',
      zh: '施工与工艺',
      en: 'Methods & Execution',
    },
    nameSv: 'Byggmetoder & Processer',
    nameZh: '施工与工艺',
    nameEn: 'Methods & Execution',
    icon: '📐',
    color: 'text-indigo-700',
    bgLight: 'bg-indigo-50',
    bg: 'bg-indigo-50',
    text: 'text-indigo-800',
    border: 'border-indigo-200',
  },
};
