const bcrypt = require('bcrypt')
const db = require('../../models')
const sequelize = require('../../config/database')
const { where } = require('sequelize')

//tambah opd
const tambahOpd = async (req,res) => {
    const transaction = await sequelize.transaction()
    try {
        const {nama, email, password, konfirmasiPass, alamat, no_hp} = req.body
        if (!nama || !email || !password || !konfirmasiPass || !alamat ||!no_hp) {
            return res.status(400).json({success: false, status:400, message: 'Silahkan lengkapi data akun opd'})
        }
        if (password != konfirmasiPass) {
            return res.status(400).json({success: false, status: 400, message: 'Password dan konfirmasi password tidak sama'})
        }

        if (password.length < 8) {
            return res.status(400).json({success: false, status:400, message: 'Password minimal 8 karakter'})
        }

        const hashPass = await bcrypt.hash(password, 10)

        const findEmail = await db.Opd.findOne({
            include: [
                {
                    model: db.User,
                    as: 'user',
                    where:{
                        email: email
                    }
                }
            ]
        })

        const findNama = await db.Opd.findOne({
            where: {
                nama_opd: nama
            }
        })

        if (findNama) {
            return res.status(400).json({success: false, status: 400, message: 'Nama sudah digunakan'})
        }

        if (findEmail) {
            return res.status(400).json({success: false, status:400, message: 'Email sudah digunakan'})
        }

        const addUser = await db.User.create({
            email,
            password: hashPass
        }, {transaction})
        await transaction.commit()
        await db.Opd.create({
            id_opd: addUser.id_user,
            nama_opd:nama,
            alamat,
            no_hp
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
            attributes: ['id_opd', 'nama_opd', 'alamat', 'no_hp'],
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
        const {nama, email, password, konfirmasiPass, alamat, no_hp} = req.body
        const findUser = await db.User.findByPk(id_user, {
            include: [
                {
                    model: db.Opd,
                    as: 'opd'
                }
            ]
        }, {transaction})

        if (!findUser) {
            await transaction.rollback()
            return res.status(404).json({
                success: false, 
                status: 404, 
                message: 'Data OPD tidak ditemukan'
            })
        }

        const updateData = {}

        if (email) {
            if (email !== findUser.email) {
                const existingEmail = await db.User.findOne({
                    where: {
                        email,
                        id_user: { [db.Sequelize.Op.ne]: id_user } 
                    },
                    transaction
                })

                if (existingEmail) {
                    await transaction.rollback()
                    return res.status(400).json({success:false, status:400, message: 'Email sudah digunakan'})
                }
                updateData.email = email
            }
        }

        if (nama) {
            if (nama !== findUser.opd.nama_opd) {
                const existingNama = await db.Opd.findOne({
                    where:{
                        nama_opd: nama,
                        id_opd: { [db.Sequelize.Op.ne]: findUser.opd.id_opd } 
                    },
                    transaction
                })

                if (existingNama) {
                    await transaction.rollback()
                    return res.status(400).json({success: false, status:400, message: 'Nama sudah digunakan'})
                }
            }
        }

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

        if (Object.keys(updateData).length > 0) {
            await db.User.update(updateData, {
                where: {id_user}, 
                transaction
            })
        }

        const opdUpdateData = {}
        if (nama) opdUpdateData.nama_opd = nama
        if (alamat) opdUpdateData.alamat = alamat
        if (no_hp) opdUpdateData.no_hp = no_hp

        if (Object.keys(opdUpdateData).length > 0) {
            await db.Opd.update(opdUpdateData, {
                where: {id_opd: findUser.opd.id_opd},
                transaction
            })
        }

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
        const userId = req.user.id_user
        const findUser = await db.User.findByPk(id_user, {transaction})
        if (!findUser) {
            await transaction.rollback()
            return res.status(400).json({success: false, status: 400, message: 'Data opd tidak ditemukan'})
        }

        await db.Opd.update(
            {
                is_active: false,
                deleted_at: new Date(),
                deleted_by: userId
            }, 
            {
                where: {id_opd: id_user},
                transaction
            }
        );

        await findUser.update({
            is_active: false
        }, {transaction})

        await transaction.commit()
        res.status(200).json({success:true, status:200, message: 'Data opd berhasil dihapus'})
    } catch (error) {
        console.error(error)
        return res.status(500).json({success:false, status:500, message: 'Kesalahan Server'})
    }
}

const detailOpd = async (req,res) => {
    try {
        const {id_opd} = req.params
        const findOpd = await db.Opd.findByPk(id_opd, {
            include: [
                {
                    model: db.User,
                    as: 'user',
                    attributes: ['id_user', 'email']
                }
            ],
            attributes: ['id_opd', 'nama_opd', 'no_hp']
        })
        if (!findOpd) {
            return res.status(400).json({success: false, status:400, message: 'Data opd tidak ditemukan'})
        }
        return res.status(200).json({success: true, status: 200, message: 'Data ditemukan', data: findOpd})

    } catch (error) {
        console.error(error)
        return res.status(500).json({success:false, status:500, message: 'Kesalahan Server'})
    }
}

module.exports = {tambahOpd, listOpd, editOpd, hapusOpd, detailOpd}