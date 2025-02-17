'use strict';

const { v4: uuidv4 } = require('uuid');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Generate UUID 
    const uuids = {
      tipe1: uuidv4(),
      tipe2: uuidv4(),
      tipe3: uuidv4(),
      tipe4: uuidv4(),
      tipe5: uuidv4(),
      tipe6: uuidv4(),
      tipe7: uuidv4()
    };

    // Seed Tipe_pertanyaan
    await queryInterface.bulkInsert('Tipe_pertanyaans', [
      {
        id_tipe_pertanyaan: uuids.tipe1,
        nama_jenis: 'Pilihan tunggal',
        kode_jenis: 'single_choice',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id_tipe_pertanyaan: uuids.tipe2,
        nama_jenis: 'Pilihan tunggal dengan trigger ke multiple choice',
        kode_jenis: 'single_choice_trigger_multi',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id_tipe_pertanyaan: uuids.tipe3,
        nama_jenis: 'Pilihan tunggal dengan trigger ke isian',
        kode_jenis: 'singel_choice_trigger_text',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id_tipe_pertanyaan: uuids.tipe4,
        nama_jenis: 'Pilihan tunggal dengan trigger ke pilihan tunggal',
        kode_jenis: 'single_choice_trigger_single',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id_tipe_pertanyaan: uuids.tipe5,
        nama_jenis: 'Isian text',
        kode_jenis: 'text_only',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id_tipe_pertanyaan: uuids.tipe6,
        nama_jenis: 'Pilihan jamak',
        kode_jenis: 'multiple_choice',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id_tipe_pertanyaan: uuids.tipe7,
        nama_jenis: 'Pilihan jamak dengan opsi lainnya',
        kode_jenis: 'multi_choice_other',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ], {});

    // Seed Tipe_opsi
    await queryInterface.bulkInsert('Tipe_opsi_jawabans', [
      {
        id_tipe_opsi: uuidv4(),
        nama_tipe: 'single_select',
        allow_other: false,
        has_trigger: false,
        id_tipe_pertanyaan: uuids.tipe1,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id_tipe_opsi: uuidv4(),
        nama_tipe: 'single_select',
        allow_other: false,
        has_trigger: true,
        id_tipe_pertanyaan: uuids.tipe2,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id_tipe_opsi: uuidv4(),
        nama_tipe: 'single_select',
        allow_other: false,
        has_trigger: true,
        id_tipe_pertanyaan: uuids.tipe3,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id_tipe_opsi: uuidv4(),
        nama_tipe: 'single_select',
        allow_other: false,
        has_trigger: true,
        id_tipe_pertanyaan: uuids.tipe4,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id_tipe_opsi: uuidv4(),
        nama_tipe: 'text',
        allow_other: false,
        has_trigger: false,
        id_tipe_pertanyaan: uuids.tipe5,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id_tipe_opsi: uuidv4(),
        nama_tipe: 'multi_select',
        allow_other: false,
        has_trigger: false,
        id_tipe_pertanyaan: uuids.tipe6,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id_tipe_opsi: uuidv4(),
        nama_tipe: 'multi_select',
        allow_other: true,
        has_trigger: false,
        id_tipe_pertanyaan: uuids.tipe7,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Tipe_opsi_jawabans', null, {});
    await queryInterface.bulkDelete('Tipe_pertanyaans', null, {});
  }
};