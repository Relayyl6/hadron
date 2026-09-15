import React from 'react';

interface props {
  title: string;
  children: React.ReactNode;
}

const SideBarMenu = ({ title, children }: props) => {
  return (
    <div className="flex flex-col w-full">
      {/* Category Title */}
      <h3 className="text-[11px] font-medium text-slate-400 uppercase tracking-wider px-3 mb-1">
        {title}
      </h3>

      {/* Menu Items Container */}
      <div className="flex flex-col">{children}</div>
    </div>
  );
};

export default SideBarMenu;
