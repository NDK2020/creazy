import { transformModeleToRoute } from '@/libs'

const module = import.meta.glob('./**/*.ts', { eager: true }) as Route.Module

const routes = transformModeleToRoute(module)

export default routes
