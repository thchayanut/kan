import "~/styles/globals.css";

import { type AppType } from "next/app";
import { Plus_Jakarta_Sans } from "next/font/google";

import { ModalProvider } from "~/providers/modal";
import { BoardProvider } from "~/providers/board";
import { ThemeProvider } from "~/providers/theme";

import { api } from "~/utils/api";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  display: "swap",
});

export const metadata = {
  title: "Kan",
  description: "The open source Trello alternative",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

const MyApp: AppType = ({ Component, pageProps }) => {
  return (
    <>
      <style jsx global>{`
        html {
          font-family: ${jakarta.style.fontFamily};
        }
      `}</style>
      <main className="h-screen overflow-hidden font-sans">
        <ThemeProvider>
          <ModalProvider>
            <BoardProvider>
              <Component {...pageProps} />
            </BoardProvider>
          </ModalProvider>
        </ThemeProvider>
      </main>
    </>
  );
};

export default api.withTRPC(MyApp);
