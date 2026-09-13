import { useCallback, useEffect, useState } from "react"
import { dummyAttendanceData } from "../assets/assets"
import Loading from "../components/Loadin"
import CheckInButton from "../components/attendance/CheckInButton"
import AttendanceStats from "../components/attendance/AttendanceStats"
import AttendanceHistory from "../components/attendance/AttendanceHistory"
import api from "../api/axios"
import { toast } from "react-hot-toast"

const Attendance = () => {
    const [history, setHistory] = useState([])
    const [loading, setLoading] = useState(true)
    const [isDeleted, setIsDeleted] = useState(false)

    const fetchData = useCallback(async () => {
        try {
            const res = await api.get("/attendance")
            const json = res.data
            setHistory(json.data || [])
            if(json.employee?.isDeleted) setIsDeleted(true)
        } catch (error) {
            toast.error(error?.response?.data?.error || error?.message)
        } finally {
            setLoading(false)
        }
    },[])

    useEffect(() => {
        fetchData()
    },[fetchData])

    if(loading) return <Loading />

    const today = new Date()
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime()
    const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59).getTime()

    const todayRecord = history.find((r) => {
        if (!r.checkIn) return false
        const checkInTime = new Date(r.checkIn).getTime()
        return checkInTime >= startOfToday && checkInTime <= endOfToday
    })
    return (
        <div className="animate-fade-in">
            <div className="page-header">
                <h1 className="page-title">Attendance</h1>
                <p className="page-subtitle">Track your work hours and daily check-ins</p>
            </div>

            {isDeleted ? (
                <div className="mb-8 p-6 bg-rose-50 border border-rose-200 rounded-2xl text-center">
                    <p className="text-rose-600">You can no longer clock in or out because your employee records have been marked as deleted.</p>
                </div>
            ) : (
                <div className="mb-8">
                    <CheckInButton todayRecord={todayRecord} onAction={fetchData} />
                </div>
            )}

            <AttendanceStats history={history} />
            <AttendanceHistory history={history} />
        </div>
    )
}

export default Attendance