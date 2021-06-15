import { createGlobalState } from "react-hooks-global-state";
import {State, SensibleSatotx} from './stateType'

const defaultSatotx: SensibleSatotx = {
    satotxApiPrefix: 'https://api.satotx.com', 
    satotxPubKey: '25108ec89eb96b99314619eb5b124f11f00307a833cda48f5ab1865a04d4cfa567095ea4dd47cdf5c7568cd8efa77805197a67943fe965b0a558216011c374aa06a7527b20b0ce9471e399fa752e8c8b72a12527768a9fc7092f1a7057c1a1514b59df4d154df0d5994ff3b386a04d819474efbd99fb10681db58b1bd857f6d5'
}

// app state
const initialState: State = {
    account: null,
    key: null,
    bsvBalance: null,
    sensibleFtList: [],
    satotxConfigMap: new Map()
};
initialState.satotxConfigMap.set(
    '5b3bfa8e7600d701e70551075573ea28fd16c25a39fe2bdafdc3e08b11ca76b800000000', 
    [defaultSatotx, defaultSatotx, defaultSatotx]
)
const { useGlobalState, getGlobalState, setGlobalState } = createGlobalState(initialState);

export {
    useGlobalState,
    getGlobalState,
    setGlobalState,
    defaultSatotx,
}
