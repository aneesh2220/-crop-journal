import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import { LANGUAGE_CODES } from './languages'

import en from './locales/en.json'
import hi from './locales/hi.json'
import as_ from './locales/as.json'
import bn from './locales/bn.json'
import brx from './locales/brx.json'
import doi from './locales/doi.json'
import gu from './locales/gu.json'
import kn from './locales/kn.json'
import ks from './locales/ks.json'
import gom from './locales/gom.json'
import mai from './locales/mai.json'
import ml from './locales/ml.json'
import mni from './locales/mni.json'
import mr from './locales/mr.json'
import ne from './locales/ne.json'
import or_ from './locales/or.json'
import pa from './locales/pa.json'
import sa from './locales/sa.json'
import sat from './locales/sat.json'
import sd from './locales/sd.json'
import ta from './locales/ta.json'
import te from './locales/te.json'
import ur from './locales/ur.json'

export const resources = {
  en: { translation: en },
  hi: { translation: hi },
  as: { translation: as_ },
  bn: { translation: bn },
  brx: { translation: brx },
  doi: { translation: doi },
  gu: { translation: gu },
  kn: { translation: kn },
  ks: { translation: ks },
  gom: { translation: gom },
  mai: { translation: mai },
  ml: { translation: ml },
  mni: { translation: mni },
  mr: { translation: mr },
  ne: { translation: ne },
  or: { translation: or_ },
  pa: { translation: pa },
  sa: { translation: sa },
  sat: { translation: sat },
  sd: { translation: sd },
  ta: { translation: ta },
  te: { translation: te },
  ur: { translation: ur },
} as const

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    supportedLngs: LANGUAGE_CODES,
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'agroai_language',
      caches: ['localStorage'],
    },
  })

export default i18n
