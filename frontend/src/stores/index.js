import { createPinia } from 'pinia'

export const pinia = createPinia()

export { useUserStore } from './user'
export { useThemeStore } from './theme'
export { useMessageStore } from './message'
export { useFriendshipStore } from './friendship'

export default pinia
