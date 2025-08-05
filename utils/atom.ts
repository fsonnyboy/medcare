import { atom } from 'recoil';

export const userData = atom({
    key: 'userDataAtom',
    default: {
        id: 0,
        username: '',
        name: '',
        middleName: '',
        lastName: '',
        image: '',
        DateOfBirth: '',
        age: 0,
        address: '',
        contactNumber: '',
        status: '',
        createdAt: '',
        updatedAt: '',
    },
});
