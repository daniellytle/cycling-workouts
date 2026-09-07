import { createContext, useContext } from "react"

export const FTP_DEFAULT = 300

export const FtpContext = createContext<number>(FTP_DEFAULT)

export const useFtp = (): number => useContext(FtpContext)
