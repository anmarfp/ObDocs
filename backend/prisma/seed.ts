import { PrismaClient, Role, NotificationMode, DocumentStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { calculateDocumentStatus } from '../src/services/statusService.js';

const prisma = new PrismaClient();

const SEED_MARKER = 'Gerado pelo seed automatizado de demonstração.';

const FIRST_NAMES = ['Fernanda', 'Ricardo', 'Juliana', 'Marcelo', 'Camila', 'Bruno', 'Patrícia', 'Diego', 'Larissa', 'Rodrigo'];
const LAST_NAMES = ['Alves Rocha', 'Tavares Nunes', 'Prado Barbosa', 'Andrade Costa', 'Ribeiro Duarte', 'Martins Pereira', 'Cardoso Lima', 'Farias Moreira'];

function pickRandom<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function daysFromNow(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
}

async function main() {
  console.log('🌱 Iniciando o seed do banco de dados DocsOb...');

  // 1. Configuração Padrão da Empresa (Single-Tenant no MVP)
  const existingConfig = await prisma.companyConfig.findFirst();
  if (!existingConfig) {
    await prisma.companyConfig.create({
      data: {
        notificationMode: NotificationMode.ALL_ADMINS,
      },
    });
    console.log('✅ Configuração padrão da empresa criada (Modo: Notificar Todos os Administradores).');
  }

  // 2. Usuário Administrador Padrão
  const adminEmail = 'admin@docsob.com.br';
  let adminUser = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!adminUser) {
    const adminPasswordHash = await bcrypt.hash('Admin123!@#', 10);
    adminUser = await prisma.user.create({
      data: {
        name: 'Administrador do Sistema',
        email: adminEmail,
        passwordHash: adminPasswordHash,
        role: Role.ADMIN,
        isActive: true,
      },
    });
    console.log(`✅ Usuário Administrador criado: ${adminEmail}`);
  }

  // 3. Usuário Operacional de Demonstração
  const opEmail = 'operacional@docsob.com.br';
  const existingOp = await prisma.user.findUnique({
    where: { email: opEmail },
  });

  if (!existingOp) {
    const opPasswordHash = await bcrypt.hash('Operacional123!@#', 10);
    await prisma.user.create({
      data: {
        name: 'Analista Operacional',
        email: opEmail,
        passwordHash: opPasswordHash,
        role: Role.OPERATIONAL,
        isActive: true,
      },
    });
    console.log(`✅ Usuário Operacional criado: ${opEmail}`);
  }

  // 4. Categorias Padrão de Documentos
  const defaultCategories = [
    { name: 'Fiscal', colorHex: '#3b82f6', description: 'Certidões negativas, guias de impostos, cadastros fiscais e declarações' },
    { name: 'Trabalhista & Previdenciário', colorHex: '#10b981', description: 'FGTS, CNDT, PCMSO, PGR, PPRA e obrigações trabalhistas' },
    { name: 'Licenças e Alvarás', colorHex: '#f59e0b', description: 'Alvarás de funcionamento, vigilância sanitária, corpo de bombeiros e meio ambiente' },
    { name: 'Contratos e Parcerias', colorHex: '#8b5cf6', description: 'Contratos de prestação de serviços, locações, fornecedores e termos aditivos' },
    { name: 'Seguros e Apólices', colorHex: '#ec4899', description: 'Seguro predial, de responsabilidade civil, vida em grupo e garantias' },
    { name: 'Frota e Veículos', colorHex: '#06b6d4', description: 'CRLV, laudos veiculares, tacógrafos e seguros de frota' },
    { name: 'Societário e Jurídico', colorHex: '#6366f1', description: 'Contrato social, procurações, atas de assembleia e registros em junta comercial' },
  ];

  const categories = [];
  for (const cat of defaultCategories) {
    const category = await prisma.documentCategory.upsert({
      where: { name: cat.name },
      update: {},
      create: cat,
    });
    categories.push(category);
  }
  console.log(`✅ ${defaultCategories.length} categorias padrão sincronizadas.`);

  // 5. Usuários Aleatórios de Demonstração
  const existingSeedDoc = await prisma.document.findFirst({ where: { notes: SEED_MARKER } });

  if (!existingSeedDoc) {
    const firstNames = shuffle(FIRST_NAMES).slice(0, 5);
    const lastNames = shuffle(LAST_NAMES).slice(0, 5);
    const randomUsers = [];

    for (let i = 0; i < 5; i++) {
      const name = `${firstNames[i]} ${lastNames[i]}`;
      const lastNameParts = lastNames[i].split(' ');
      const emailLocal = `${firstNames[i]}.${lastNameParts[lastNameParts.length - 1]}`
        .toLowerCase()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '');
      const email = `${emailLocal}@docsob.com.br`;
      // No máximo 1 dos 5 é ADMIN, mantendo o perfil Operacional como maioria (RN-009).
      const role = i === 0 ? Role.ADMIN : Role.OPERATIONAL;
      const passwordHash = await bcrypt.hash('Seed123!@#', 10);

      const user = await prisma.user.upsert({
        where: { email },
        update: {},
        create: { name, email, passwordHash, role, isActive: true },
      });
      randomUsers.push(user);
      console.log(`✅ Usuário aleatório criado: ${email} (${role})`);
    }

    // 6. Documentos de Demonstração com Status Variados (RN-001)
    const allUsers = [adminUser, ...randomUsers];
    const documentSeeds: Array<{
      title: string;
      categoryName: string;
      issuingBody: string;
      expirationDate: Date | null;
      alertLeadDays?: number;
      forceRenewal?: boolean;
      responsibleName?: string;
      responsibleEmail?: string;
    }> = [
      // 🔴 EXPIRED
      { title: 'Certidão Negativa de Débitos Federais (CND)', categoryName: 'Fiscal', issuingBody: 'Receita Federal do Brasil', expirationDate: daysFromNow(-15) },
      { title: 'CNDT - Certidão Negativa de Débitos Trabalhistas', categoryName: 'Trabalhista & Previdenciário', issuingBody: 'Tribunal Superior do Trabalho', expirationDate: daysFromNow(-3) },
      // 🟡 CRITICAL
      { title: 'Alvará de Funcionamento', categoryName: 'Licenças e Alvarás', issuingBody: 'Prefeitura Municipal', expirationDate: daysFromNow(10) },
      { title: 'Apólice de Seguro Predial', categoryName: 'Seguros e Apólices', issuingBody: 'Porto Seguro S.A.', expirationDate: daysFromNow(20) },
      // 🔵 RENEWAL_IN_PROGRESS
      { title: 'Licença do Corpo de Bombeiros (AVCB)', categoryName: 'Licenças e Alvarás', issuingBody: 'Corpo de Bombeiros', expirationDate: daysFromNow(7), forceRenewal: true },
      { title: 'CRLV - Veículo Placa ABC-1D23', categoryName: 'Frota e Veículos', issuingBody: 'DETRAN', expirationDate: daysFromNow(15), forceRenewal: true },
      // 🟢 REGULAR
      { title: 'Contrato de Locação - Sede Administrativa', categoryName: 'Contratos e Parcerias', issuingBody: 'Imobiliária Central Ltda.', expirationDate: daysFromNow(120) },
      { title: 'PCMSO - Programa de Controle Médico de Saúde Ocupacional', categoryName: 'Trabalhista & Previdenciário', issuingBody: 'Clínica Ocupacional Vida', expirationDate: daysFromNow(200) },
      // ⚪ INDETERMINATE
      { title: 'Contrato Social Consolidado', categoryName: 'Societário e Jurídico', issuingBody: 'Junta Comercial', expirationDate: null },
      { title: 'Procuração Geral de Representação', categoryName: 'Societário e Jurídico', issuingBody: 'Cartório do 1º Ofício', expirationDate: null },
    ];

    for (const seedDoc of documentSeeds) {
      const category = categories.find((c) => c.name === seedDoc.categoryName)!;
      const creator = pickRandom(allUsers);
      const alertLeadDays = seedDoc.alertLeadDays ?? 30;
      const status = seedDoc.forceRenewal
        ? DocumentStatus.RENEWAL_IN_PROGRESS
        : calculateDocumentStatus(seedDoc.expirationDate, alertLeadDays, false);

      await prisma.document.create({
        data: {
          title: seedDoc.title,
          categoryId: category.id,
          issuingBody: seedDoc.issuingBody,
          issueDate: daysFromNow(-365),
          expirationDate: seedDoc.expirationDate,
          alertLeadDays,
          status,
          responsibleName: creator.name,
          responsibleEmail: creator.email,
          notes: SEED_MARKER,
          createdById: creator.id,
        },
      });
    }
    console.log(`✅ ${documentSeeds.length} documentos de demonstração criados com status variados.`);
  } else {
    console.log('ℹ️ Documentos de demonstração já existentes — pulando geração de usuários e documentos aleatórios.');
  }

  console.log('✨ Seed finalizado com sucesso!');
}

main()
  .catch((e) => {
    console.error('❌ Erro durante o seed do banco de dados:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
