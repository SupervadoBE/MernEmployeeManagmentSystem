import Employee from "../models/Employee.js"
import bcrypt from "bcrypt"
import User from "../models/User.js"

// Get employees
// GET /api/employees
export const getEmployees = async (req, res) => {
    try {
        const { department } = req.query
        const where = {}
        if(department) where.department = department

        const employees = await Employee.find(where)
                                    .sort({createdAt: -1})
                                    .populate("userId", "email role")
                                    .lean()

        const result = employees.map((emp) => {
            // Eğer kritik bir veri eksikse geliştirici paneline/log sistemine yaz
            if (!emp.userId) {
                console.warn(`[UYARI] ${emp._id} ID'li çalışanın userId bağlantısı eksik!`);
            }

            return {
                ...emp,
                id: emp._id?.toString(),
                user: emp.userId 
                    ? { email: emp.userId.email, role: emp.userId.role } 
                    : { email: "E-posta Yok", role: "Atanmamış" } // Kullanıcıya "kayıp" olduğunu hissettir ama sayfayı bozma
            }
        })

        return res.status(200).json(result)
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Çalışanları getirirken bir hata oluştu",
            error: error.message
        })
    }
}

// Create employee
// POST /api/employees
export const createEmployee = async (req, res) => {
    try {
        const {firstName, lastName, email, phone, position, department, basicSalary, allowances, deductions, joinDate, password, role, bio} = req.body

        if(!email || !password || !firstName || !lastName) {
            return res.status(400).json({error: "Missing required fields"})
        }

        const hashed = await bcrypt.hash(password, 10)
        const user = await User.create({
            email,
            password: hashed,
            role: role || "EMPLOYEE"
        })

        const employee = Employee.create({
            userId: user._id,
            firstName,
            lastName,
            email,
            phone,
            position,
            basicSalary: Number(basicSalary) || 0,
            allowances: Number(allowances) || 0,
            deductions: Number(deductions) || 0,
            joinDate: new Date(joinDate),
            bio: bio || "",
            department: department || "Engineering",
        })

        return res.status(201).json({success: true, employee})

    } catch (error) {
        if(error.code === 11000){
            return res.status(400).json({success: false, error: "Email already exists"})
        }
        console.error("Create employee error: ", error)
        return res.status(500).json({ success: false, error: "Failed to create employee"})
    }
}

// Update employee
// PUT /api/employees/:id
export const updateEmployee = async (req, res) => {
    try {
        const {id} = req.params
        const {firstName, lastName, email, phone, position, department, basicSalary, allowances, deductions, password, role, bio, employmentStatus} = req.body

        const employee = await Employee.findById(id)
        if(!employee)
        {
            return res.status(404).json({success: false, error:"Employee not found"})
        }

        await Employee.findByIdAndUpdate(id, {
            firstName,
            lastName,
            email,
            phone,
            position,
            basicSalary: Number(basicSalary) || 0,
            allowances: Number(allowances) || 0,
            deductions: Number(deductions) || 0,
            employmentStatus: employmentStatus || "ACTIVE",
            bio: bio || "",
            department: department || "Engineering",
        })

        // Update user record
        const userUpdate = {email}
        if(role){
            userUpdate.role = role
        }
        if(password){
            userUpdate.password = await bcrypt.hash(password, 10)
        }
        await User.findByIdAndUpdate(employee.userId, userUpdate)

        return res.status(201).json({success: true, employee})

    } catch (error) {
        if(error.code === 11000){
            return res.status(400).json({success: false, error: "Email already exists"})
        }
        console.error("Update employee error: ", error)
        return res.status(500).json({ success: false, error: "Failed to update employee"})
    }
}
// Delete employee
// DELETE /api/employees/:id
export const deleteEmployee = async (req, res) => {
    try {
        const { id } = req.params

        const employee = await Employee.findById(id)
        if(!employee) {
            return res.status(404).json({success: false, error: "Employee not found" })

            employee.isDeleted = true
            employee.employmentStatus = "INACTIVE"
            await employee.save()

            return res.json({ success: true })
        }
    } catch (error) {
        return res.status(500).json({ success: false, error: "Failed to delete employee "})
    }
}