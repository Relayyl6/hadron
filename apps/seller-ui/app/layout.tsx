import './global.css';
// import Header from "../utils/header"
import { Poppins, Roboto } from 'next/font/google';
import { UserProvider } from '../context/user-context';
import Providers from '../utils/providers';
import 'react-toastify/dist/ReactToastify.css';
import { ToastContainer } from 'react-toastify';

export const roboto = Roboto({
  subsets: ['latin'],
  weight: ['100', '300', '400', '500', '700', '900'],
  variable: '--font-roboto',
});

export const poppins = Poppins({
  subsets: ['latin'],
  weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900'],
  variable: '--font-poppins',
});

export const metadata = {
  title: 'Hadron Workspace',
  description: 'Mobile and web e-commerce application',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${roboto.variable} ${poppins.variable} min-h-screen bg-slate-900 font-sans antialiased`}
      >
        <Providers>
          <UserProvider>
            {/* <Header /> */}
            {children}
            <ToastContainer
              position="bottom-right"
              autoClose={5000}
              hideProgressBar={false}
              newestOnTop={false}
              closeOnClick={false}
              rtl={false}
              pauseOnFocusLoss
              draggable
              pauseOnHover
              theme="light"
            />
          </UserProvider>
        </Providers>
      </body>
    </html>
  );
}
