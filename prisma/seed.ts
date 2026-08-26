import { PrismaClient, Role, NotificationMode } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

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
    console.log(`✅ Usuário Administrador criado: ${adminEmail} (Senha: Admin123!@#)`);
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
    console.log(`✅ Usuário Operacional criado: ${opEmail} (Senha: Operacional123!@#)`);
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

  for (const cat of defaultCategories) {
    await prisma.documentCategory.upsert({
      where: { name: cat.name },
      update: {},
      create: cat,
    });
  }
  console.log(`✅ ${defaultCategories.length} categorias padrão sincronizadas.`);

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
