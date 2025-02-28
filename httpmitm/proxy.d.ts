interface ServerConfig {
   
   filters: FilterType[],
   filterPath?: string,
   proxyPath?: string,
   reverseProxyUrl?: string
   
}

interface FilterInfo {
   tls: boolean,
   host: string,
   path?: string // Only valid if tls is false
}

declare global {
   type FilterType = "http"|"https"
   
}


declare type FilterFunction = (filterInfo: FilterInfo)=>Promise<boolean>|boolean
export { ServerConfig, FilterInfo, FilterFunction }