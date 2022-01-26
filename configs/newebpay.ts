export enum SupportedLanguage {
  TRADITIONAL_CHINESE = 'zh-tw',
  ENGLISH = 'en',
  JAPANESE = 'jp',
}
export const languageOptions = [
  {
    label: '繁體中文',
    value: SupportedLanguage.TRADITIONAL_CHINESE,
  },
  {
    label: '英文',
    value: SupportedLanguage.ENGLISH,
  },
  {
    label: '日文',
    value: SupportedLanguage.JAPANESE,
  },
]
