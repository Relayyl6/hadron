'use client';

import { useAtom } from 'jotai';
import { activeSideBarItem } from '../configs/constants';

const useSideBar = () => {
  const [activeSideBar, setActiveSideBar] = useAtom(activeSideBarItem);
  return {
    activeSideBar,
    setActiveSideBar,
  };
};

export default useSideBar;
