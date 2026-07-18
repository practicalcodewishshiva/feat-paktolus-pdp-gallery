export type EffectiveConnectionType = 'slow-2g' | '2g' | '3g' | '4g'

export interface NetworkInformationLike {
  readonly saveData?: boolean
  readonly effectiveType?: EffectiveConnectionType | string
}

interface NavigatorWithConnection extends Navigator {
  readonly connection?: NetworkInformationLike
  readonly mozConnection?: NetworkInformationLike
  readonly webkitConnection?: NetworkInformationLike
}

export function getNetworkInformation(): NetworkInformationLike | undefined {
  if (typeof navigator === 'undefined') return undefined

  const typedNavigator = navigator as NavigatorWithConnection
  return (
    typedNavigator.connection ??
    typedNavigator.mozConnection ??
    typedNavigator.webkitConnection
  )
}
