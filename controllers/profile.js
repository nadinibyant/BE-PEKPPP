const {ValidationError, NotFoundError} = require('../utils/error')
const db = require('../models')
const sequelize = require('../config/database')
const { Op, where, Sequelize } = require('sequelize');
const bcrypt = require('bcrypt')

//update profile
const updateProfile = async (req, res) => {
    let transaction;
    try {
        const { id_admin, id_opd, id_evaluator } = req.query;
        const { nama, email } = req.body;

        if (!nama || !email) {
            throw new ValidationError('Lengkapi data akun');
        }

        transaction = await db.sequelize.transaction();

        if (id_admin) {
            const findAdmin = await db.User.findByPk(id_admin, { transaction });
            if (!findAdmin) {
                throw new NotFoundError('Data admin tidak ditemukan');
            }
            const findNama = await db.Admin.findOne({
                where: {
                    nama,
                    id_admin: { [db.Sequelize.Op.ne]: id_admin } 
                },
                transaction
            });

            if (findNama) {
                throw new ValidationError('Nama sudah digunakan');
            }

            const findEmail = await db.User.findOne({
                where: {
                    email,
                    id_user: { [db.Sequelize.Op.ne]: id_admin } 
                },
                transaction
            });

            if (findEmail) {
                throw new ValidationError('Email sudah digunakan');
            }

            await db.User.update(
                { email },
                { 
                    where: { id_user: id_admin },
                    transaction
                }
            );

            await db.Admin.update(
                { nama },
                { 
                    where: { id_admin },
                    transaction 
                }
            );
        } else if (id_opd) {
            const findOpd = await db.User.findByPk(id_opd, { transaction });
            if (!findOpd) {
                throw new NotFoundError('Data OPD tidak ditemukan');
            }

            const findNama = await db.Opd.findOne({
                where: {
                    nama_opd: nama,
                    id_opd: { [db.Sequelize.Op.ne]: id_opd }
                },
                transaction
            });

            if (findNama) {
                throw new ValidationError('Nama sudah digunakan');
            }

            const findEmail = await db.User.findOne({
                where: {
                    email,
                    id_user: { [db.Sequelize.Op.ne]: id_opd }
                },
                transaction
            });

            if (findEmail) {
                throw new ValidationError('Email sudah digunakan');
            }

            await db.User.update(
                { email },
                { 
                    where: { id_user: id_opd },
                    transaction
                }
            );

            await db.Opd.update(
                { nama_opd: nama},
                { 
                    where: { id_opd },
                    transaction 
                }
            );
        } else if (id_evaluator) {
            const findEvaluator = await db.User.findByPk(id_evaluator, { transaction });
            if (!findEvaluator) {
                throw new NotFoundError('Data evaluator tidak ditemukan');
            }

            const findNama = await db.Evaluator.findOne({
                where: {
                    nama,
                    id_evaluator: { [db.Sequelize.Op.ne]: id_evaluator }
                },
                transaction
            });

            if (findNama) {
                throw new ValidationError('Nama sudah digunakan');
            }

            const findEmail = await db.User.findOne({
                where: {
                    email,
                    id_user: { [db.Sequelize.Op.ne]: id_evaluator } 
                },
                transaction
            });

            if (findEmail) {
                throw new ValidationError('Email sudah digunakan');
            }

            await db.User.update(
                { email },
                { 
                    where: { id_user: id_evaluator },
                    transaction
                }
            );

            await db.Evaluator.update(
                { nama },
                { 
                    where: { id_evaluator },
                    transaction 
                }
            );
        } else {
            throw new ValidationError('ID tidak valid');
        }

        await transaction.commit();

        return res.status(200).json({
            success: true,
            status: 200,
            message: 'Profil berhasil diperbarui'
        });
    } catch (error) {
        console.error(error);
        if (transaction) await transaction.rollback();
        
        if (error instanceof ValidationError) {
            return res.status(400).json({
                success: false,
                status: 400,
                message: error.message
            });
        } else if (error instanceof NotFoundError) {
            return res.status(404).json({
                success: false,
                status: 404,
                message: error.message
            });
        } else {
            return res.status(500).json({
                success: false,
                status: 500,
                message: 'Kesalahan Server'
            });
        }
    }
};

//update password
const updatePassword = async (req, res) => {
    let transaction;
    try {
        transaction = await db.sequelize.transaction();

        const id_user = req.user.id_user;
        const { password_saat_ini, password_baru, konfirmasi_password_baru } = req.body;

        if (!password_saat_ini || !password_baru || !konfirmasi_password_baru) {
            throw new ValidationError('Lengkapi data password');
        }

        if (password_baru !== konfirmasi_password_baru) {
            throw new ValidationError('Password baru dan konfirmasi password tidak cocok');
        }

        if (password_baru.length < 8) {
            throw new ValidationError('Password baru minimal 8 karakter');
        }

        const findUser = await db.User.findByPk(id_user, { transaction });
        if (!findUser) {
            throw new NotFoundError('Data user tidak ditemukan');
        }

        const isPasswordValid = await bcrypt.compare(password_saat_ini, findUser.password);
        if (!isPasswordValid) {
            throw new ValidationError('Password saat ini tidak valid');
        }

        if (password_saat_ini === password_baru) {
            throw new ValidationError('Password baru tidak boleh sama dengan password saat ini');
        }

        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password_baru, saltRounds);

        await db.User.update(
            { password: hashedPassword },
            { 
                where: { id_user },
                transaction
            }
        );

        await transaction.commit();

        return res.status(200).json({
            success: true,
            status: 200,
            message: 'Password berhasil diperbarui'
        });
        
    } catch (error) {
        console.error(error);
        if (transaction) await transaction.rollback();
        
        if (error instanceof ValidationError) {
            return res.status(400).json({
                success: false,
                status: 400,
                message: error.message
            });
        } else if (error instanceof NotFoundError) {
            return res.status(404).json({
                success: false,
                status: 404,
                message: error.message
            });
        } else {
            return res.status(500).json({
                success: false,
                status: 500,
                message: 'Kesalahan Server'
            });
        }
    }
};

module.exports ={updateProfile, updatePassword}