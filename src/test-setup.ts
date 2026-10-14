import catalog_json from '../public/catalog.json'
import { installContentCatalog, parseContentCatalog } from './application/content-catalog'

const catalog = parseContentCatalog(catalog_json)
if (!catalog) throw new Error('public/catalog.json is not a valid content catalog')
installContentCatalog(catalog)
