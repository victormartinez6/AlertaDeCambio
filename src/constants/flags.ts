// Mapeamento de códigos de moeda para códigos de país ISO 3166-1
import usFlag from '@/assets/flags/us.svg'
import euFlag from '@/assets/flags/eu.svg'
import gbFlag from '@/assets/flags/gb.svg'
import caFlag from '@/assets/flags/ca.svg'
import auFlag from '@/assets/flags/au.svg'
import jpFlag from '@/assets/flags/jp.svg'
import cnFlag from '@/assets/flags/cn.svg'
import chFlag from '@/assets/flags/ch.svg'

export const FLAGS = {
  USD: usFlag,
  EUR: euFlag,
  GBP: gbFlag,
  CAD: caFlag,
  AUD: auFlag,
  JPY: jpFlag,
  CNY: cnFlag,
  CHF: chFlag,
} as const;

export type CurrencyCode = keyof typeof FLAGS;
