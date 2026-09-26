'use client';

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

// Hooks
import useSideBar from '../../hooks/useSideBar';
import useSeller from '../../hooks/useSeller';

// Components
import { Sidebar } from './SideBar.styles';
import SideBarMenu from './SideBar.menu'; // Update extension/path if needed
import SideBarItems from './SideBar.items'; // Update extension/path if needed
import Logo from '../../assets/svgs/logo';
import {
  DashboardIcon,
  OrdersIcon,
  ProductsIcon,
  CustomersIcon,
  SettingsIcon,
  PaymentsIcon,
  EventsIcon,
  VenuesIcon,
  CalendarIcon,
  NotificationsIcon,
  InboxIcon,
  DiscountIcon,
} from '@/assets/svgs/tools';

const SideBarWrapper = () => {
  const [showUserCard, setShowUserCard] = useState(false);
  const { activeSideBar, setActiveSideBar } = useSideBar();
  const pathname = usePathname();
  const { seller } = useSeller();

  useEffect(() => {
    setActiveSideBar(pathname);
  }, [pathname, setActiveSideBar]);

  // Helper to determine icon color based on active state
  const getIconColor = (route: string) =>
    activeSideBar === route ? '#0085ff' : '#969696';

  return (
    <div className="flex flex-col h-full px-5 py-4 w-full">
      {/* Sidebar Header with Logo (Won't shrink) */}
      <Sidebar.Header className="shrink-0">
        <Link href="/" className="flex justify-center text-center gap-2">
          <Logo title={seller?.shop?.name} subtitle={seller?.shop?.address} />
        </Link>
      </Sidebar.Header>

      <div className="h-[1px] w-full bg-white/10 my-4 shrink-0" />

      {/* Sidebar Body - This part handles scrolling if items exceed screen height */}
      <Sidebar.Body className="body Sidebar flex-1 overflow-y-auto pr-1 space-y-2">
        <SideBarItems
          title="Dashboard"
          href="/dashboard"
          isActive={activeSideBar === '/dashboard'}
          icon={<DashboardIcon color={getIconColor('/dashboard')} />}
        />

        <SideBarMenu title="MAIN MENU">
          <SideBarItems
            title="Orders"
            href="/dashboard/orders"
            isActive={activeSideBar === '/dashboard/orders'}
            icon={<OrdersIcon color={getIconColor('/dashboard/orders')} />}
          />
        </SideBarMenu>

        <SideBarMenu title="SHOP MANAGEMENT">
          <SideBarItems
            title="Products"
            isActive={activeSideBar?.startsWith('/dashboard/products')}
            icon={<ProductsIcon color={getIconColor('/dashboard/products')} />}
          >
            <Link
              href="/dashboard/products/new"
              className="px-3.5 py-2.5 text-sm text-slate-400 rounded-md hover:text-white hover:bg-[#2b2f31]/60 transition-colors block"
            >
              Create a new product
            </Link>
            <Link
              href="/dashboard/products/all"
              className="px-3.5 py-2.5 text-sm text-slate-400 rounded-md hover:text-white hover:bg-[#2b2f31]/60 transition-colors block"
            >
              View all products
            </Link>
          </SideBarItems>
          <SideBarItems
            title="Customers"
            href="/dashboard/customers"
            isActive={activeSideBar === '/dashboard/customers'}
            icon={
              <CustomersIcon color={getIconColor('/dashboard/customers')} />
            }
          />
        </SideBarMenu>

        <SideBarMenu title="EVENTS">
          <SideBarItems
            title="Event"
            isActive={activeSideBar?.startsWith('/dashboard/event')}
            icon={<EventsIcon color={getIconColor('/dashboard/event')} />}
          >
            <Link
              href="/dashboard/event/new"
              className="px-3.5 py-2.5 text-sm text-slate-400 rounded-md hover:text-white hover:bg-[#2b2f31]/60 transition-colors block"
            >
              Create a new event
            </Link>
            <Link
              href="/dashboard/event"
              className="px-3.5 py-2.5 text-sm text-slate-400 rounded-md hover:text-white hover:bg-[#2b2f31]/60 transition-colors block"
            >
              View all events
            </Link>
          </SideBarItems>
          <SideBarItems
            title="Calendar"
            href="/dashboard/calendar"
            isActive={activeSideBar === '/dashboard/calendar'}
            icon={<CalendarIcon color={getIconColor('/dashboard/calendar')} />}
          />
          <SideBarItems
            title="Venues"
            href="/dashboard/venues"
            isActive={activeSideBar === '/dashboard/venues'}
            icon={<VenuesIcon color={getIconColor('/dashboard/venues')} />}
          />
        </SideBarMenu>

        <SideBarMenu title="CONTROLLERS">
          <SideBarItems
            title="Inbox"
            href="/dashboard/inbox"
            isActive={activeSideBar === '/dashboard/inbox'}
            icon={<InboxIcon color={getIconColor('/dashboard/inbox')} />}
          />
          <SideBarItems
            title="Notification"
            href="/dashboard/notification"
            isActive={activeSideBar === '/dashboard/notification'}
            icon={
              <NotificationsIcon
                color={getIconColor('/dashboard/notification')}
              />
            }
          />
        </SideBarMenu>

        <SideBarMenu title="Extras">
          <SideBarItems
            title="Discount Codes"
            href="/dashboard/discount-codes"
            isActive={activeSideBar?.startsWith('/dashboard/discount-codes')}
            icon={
              <DiscountIcon color={getIconColor('/dashboard/discount-codes')} />
            }
          />
        </SideBarMenu>

        <SideBarMenu title="PAYMENT">
          <SideBarItems
            title="Payments"
            href="/dashboard/payments"
            isActive={activeSideBar === '/dashboard/payments'}
            icon={<PaymentsIcon color={getIconColor('/dashboard/payments')} />}
          />
        </SideBarMenu>
      </Sidebar.Body>

      {/* Pinned Footer for Settings (Stays anchored at the bottom with mt-auto) */}
      <Sidebar.Footer className="shrink-0 pt-3 pb-3 px-3 border-t border-slate-800/60 mt-auto">
        <div className="flex items-center justify-between w-full">
          {/* Settings Menu Item */}
          <div className="flex-grow min-w-0 pr-2">
            <SideBarItems
              title="Settings"
              href="/dashboard/settings"
              isActive={activeSideBar === '/dashboard/settings'}
              icon={
                <SettingsIcon color={getIconColor('/dashboard/settings')} />
              }
            />
          </div>

          {/* User Profile Avatar with Hover Popup */}
          <div className="relative flex-shrink-0 group">
            {/* Avatar Trigger Button */}
            <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center cursor-pointer hover:border-slate-500 transition-colors shadow-sm">
              <span className="text-xs font-semibold text-slate-200">LO</span>
            </div>

            {/* Hover Popup Card (Anchored above the avatar, aligned inside the sidebar) */}
            <div className="absolute right-0 bottom-full mb-2 w-56 p-3 bg-slate-900 border border-slate-700/80 rounded-lg shadow-2xl text-slate-200 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 transform translate-y-1 group-hover:translate-y-0">
              {/* User Info Header */}
              <div className="flex items-center space-x-3 pb-2.5 border-b border-slate-800">
                <div className="w-9 h-9 rounded-full bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-300 font-semibold text-xs flex-shrink-0">
                  LO
                </div>
                <div className="overflow-hidden min-w-0">
                  <p className="text-xs font-semibold truncate text-white">
                    Leonard Oseghale
                  </p>
                  <p className="text-[10px] text-slate-400 truncate">
                    leonard@example.com
                  </p>
                </div>
              </div>

              {/* Role & Status */}
              <div className="mt-2.5 pt-1 text-xs text-slate-400 flex justify-between items-center">
                <span>Role</span>
                <span className="text-emerald-400 font-medium">
                  Administrator
                </span>
              </div>

              {/* Logout Button */}
              <div className="mt-3 pt-2 border-t border-slate-800">
                <button
                  onClick={() => {
                    window.location.href = '/log-in';
                  }}
                  className="w-full py-1.5 px-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 rounded text-xs font-medium transition-colors flex items-center justify-center"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      </Sidebar.Footer>
    </div>
  );
};

export default SideBarWrapper;
