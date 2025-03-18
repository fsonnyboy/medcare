import { atom } from 'recoil';

export const userData = atom({
    key: 'userDataAtom',
    default: {
        id: '',
    },
});
