const bcrypt = require('bcrypt')
const db = require('../../models')
const sequelize = require('../../config/database')

//tambah opd
const tambahOpd = async (req,res) => {
    const transaction = await sequelize.transaction()
    try {
        const {nama, email, password, konfirmasiPass, alamat} = req.body
        if (!nama || !email || !password || !konfirmasiPass || !alamat) {
            return res.status(400).json({success: false, status:400, message: 'Silahkan lengkapi data akun opd'})
        }
        if (password != konfirmasiPass) {
            return res.status(400).json({success: false, status: 400, message: 'Password dan konfirmasi password tidak sama'})
        }

        if (password.length < 8) {
            return res.status(400).json({success: false, message: 'Password minimal 8 karakter'})
        }

        const hashPass = await bcrypt.hash(password, 10)
        const findOpd = await db.Opd.findOne({where:{nama_opd:nama}})
        if (findOpd) {
            await transaction.rollback()
            return res.status(400).json({success: false, message: 'Nama opd telah digunakan'})
        }

        const addUser = await db.User.create({
            email,
            password: hashPass
        }, {transaction})
        await transaction.commit()
        await db.Opd.create({
            id_opd: addUser.id_user,
            nama_opd:nama,
            alamat
        })
        return res.status(200).json({success: true, status:200, message: 'Data Opd berhasil ditambahkan'})
    } catch (error) {
        await transaction.rollback()
        console.error(error)
        return res.status(500).json({success: false, status: 500, message: 'Kesalahan Server'})
    }
}

// list opd
const listOpd = async (req,res) => {
    try {
        const getOpd = await db.Opd.findAll({
            attributes: ['id_opd', 'nama_opd', 'alamat'],
            order: [['nama_opd', 'ASC']],
            include: [
                {
                    model: db.User,
                    as: 'user',
                    attributes: ['email']
                }
            ]
        })
        return res.status(200).json({success: true, status: 200, message: 'Data opd berhasil diambil', data:getOpd})
    } catch (error) {
        console.error(error)
        return res.status(500).json({success: false, status: 500, message: 'Kesalahan Server'})
    }
}

// edit opd
const editOpd = async (req,res) => {
    const transaction = await sequelize.transaction()
    try {
        const {id_user} = req.params
        const {nama, email, password, konfirmasiPass, alamat} = req.body
        const findUser = await db.User.findByPk(id_user, {transaction})

        if (!findUser) {
            await transaction.rollback()
            return res.status(404).json({
                success: false, 
                status: 404, 
                message: 'Data OPD tidak ditemukan'
            })
        }

        const updateData = {email}

        if (password) {
            if (password.length < 8) {
                await transaction.rollback()
                return res.status(400).json({
                    success: false, 
                    status: 400, 
                    message: 'Password minimal 8 karakter'
                })
            }
            if (password !== konfirmasiPass) {
                await transaction.rollback()
                return res.status(400).json({
                    success: false, 
                    status: 400, 
                    message: 'Password dan konfirmasi tidak sama'
                })
            }
            updateData.password = await bcrypt.hash(password, 10)
        }

        await db.User.update(updateData, {
            where:{id_user}, transaction
        })

        await db.Opd.update({
            nama_opd: nama,
            alamat
        }, {
            where:{id_opd:id_user},
            transaction
        })

        await transaction.commit()

        return res.status(200).json({success: true, status: 200, message: 'Data opd berhasil diperbaharui'})
    } catch (error) {
        await transaction.rollback()
        console.error(error)
        return res.status(500).json({success: false, status: 500, message: 'Kesalahan Server'})
    }
}

// hapus opd
const hapusOpd = async (req,res) => {
    const transaction = await sequelize.transaction()
    try {
        const {id_user} = req.params
        const findUser = await db.User.findByPk(id_user, {transaction})
        if (!findUser) {
            await transaction.rollback()
            return res.status(400).json({success: false, status: 400, message: 'Data opd tidak ditemukan'})
        }
        await db.Opd.destroy({where:{id_opd:id_user}, transaction})
        await db.User.destroy({where:{id_user},transaction})

        await transaction.commit()
        res.status(200).json({success:true, status:200, message: 'Data opd berhasil dihapus'})
    } catch (error) {
        console.error(error)
        return res.status(500).json({success:false, status:500, message: 'Kesalahan Server'})
    }
}

module.exports = {tambahOpd, listOpd, editOpd, hapusOpd}