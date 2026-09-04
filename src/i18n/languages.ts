export interface LanguageDef {
  code: string
  name: string
  nativeName: string
  /** BCP-47 tag used for Web Speech API (STT/TTS) voice matching */
  speechTag: string
}

// 22 scheduled Indian languages + English, per the Eighth Schedule of the Constitution of India.
export const LANGUAGES: LanguageDef[] = [
  { code: 'en', name: 'English', nativeName: 'English', speechTag: 'en-IN' },
  { code: 'as', name: 'Assamese', nativeName: 'অসমীয়া', speechTag: 'as-IN' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', speechTag: 'bn-IN' },
  { code: 'brx', name: 'Bodo', nativeName: 'बड़ो', speechTag: 'hi-IN' },
  { code: 'doi', name: 'Dogri', nativeName: 'डोगरी', speechTag: 'hi-IN' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી', speechTag: 'gu-IN' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', speechTag: 'hi-IN' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ', speechTag: 'kn-IN' },
  { code: 'ks', name: 'Kashmiri', nativeName: 'کٲشُر', speechTag: 'ur-IN' },
  { code: 'gom', name: 'Konkani', nativeName: 'कोंकणी', speechTag: 'mr-IN' },
  { code: 'mai', name: 'Maithili', nativeName: 'मैथिली', speechTag: 'hi-IN' },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം', speechTag: 'ml-IN' },
  { code: 'mni', name: 'Manipuri', nativeName: 'ꯃꯤꯇꯩꯂꯣꯟ', speechTag: 'hi-IN' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी', speechTag: 'mr-IN' },
  { code: 'ne', name: 'Nepali', nativeName: 'नेपाली', speechTag: 'ne-IN' },
  { code: 'or', name: 'Odia', nativeName: 'ଓଡ଼ିଆ', speechTag: 'or-IN' },
  { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', speechTag: 'pa-IN' },
  { code: 'sa', name: 'Sanskrit', nativeName: 'संस्कृतम्', speechTag: 'hi-IN' },
  { code: 'sat', name: 'Santali', nativeName: 'ᱥᱟᱱᱛᱟᱲᱤ', speechTag: 'hi-IN' },
  { code: 'sd', name: 'Sindhi', nativeName: 'سنڌي', speechTag: 'ur-IN' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', speechTag: 'ta-IN' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', speechTag: 'te-IN' },
  { code: 'ur', name: 'Urdu', nativeName: 'اردو', speechTag: 'ur-IN' },
]

export const LANGUAGE_CODES = LANGUAGES.map((l) => l.code)

export function getLanguage(code: string): LanguageDef {
  return LANGUAGES.find((l) => l.code === code) ?? LANGUAGES[0]
}
