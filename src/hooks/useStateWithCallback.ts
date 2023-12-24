import {
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'

export const useStateWithCallback = <T>(
  initialState?: T
): [T, (newState?: T, cb?: any) => void] => {
  const [state, setState] = useState<T | undefined>(initialState)
  const cbRef = useRef<any | null>()

  const updateState = useCallback((newState: T, cb: any) => {
    cbRef.current = cb

    setState((prev) =>
      typeof newState === 'function' ? newState(prev) : newState
    )
  }, [])

  useEffect(() => {
    if (cbRef.current) {
      cbRef.current(state)
      cbRef.current = null
    }
  }, [state])

  // @ts-ignore
  return [state, updateState]
}
