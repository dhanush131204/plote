const AdminJS = require('adminjs');
const { Database, Resource } = require('@adminjs/prisma');
const bcrypt = require('bcrypt');
const prisma = require('../server/prisma');

AdminJS.registerAdapter({
  Database,
  Resource,
});

// Mock _baseDmmf on prisma for compatibility with Prisma v5
const modelMap = {};
for (const [key, value] of Object.entries(prisma._runtimeDataModel.models)) {
  modelMap[key] = {
    ...value,
    name: key
  };
}
prisma._baseDmmf = {
  modelMap: modelMap,
  datamodelEnumMap: prisma._runtimeDataModel.enums || {}
};

const getModel = (name) => prisma._baseDmmf.modelMap[name];

// Hook to hash user passwords before saving to the database
const beforeSaveUser = async (request) => {
  if (request.method === 'post' && request.payload) {
    const { password, ...rest } = request.payload;
    if (password && password.trim() !== '') {
      const hashedPassword = await bcrypt.hash(password, 10);
      return {
        ...request,
        payload: {
          ...rest,
          passwordHash: hashedPassword,
        },
      };
    } else {
      // If password field is empty (e.g. during edit), omit it so it doesn't overwrite the existing hash
      return {
        ...request,
        payload: rest,
      };
    }
  }
  return request;
};

// Password field configuration to hide it in list/show/filter views
const passwordPropertyConfig = {
  password: {
    type: 'password',
    isVisible: {
      list: false,
      edit: true,
      filter: false,
      show: false,
    },
  },
  passwordHash: {
    isVisible: false
  }
};

const resources = [
  {
    resource: {
      model: getModel('User'),
      client: prisma,
    },
    options: {
      properties: passwordPropertyConfig,
      actions: {
        new: { before: beforeSaveUser },
        edit: { before: beforeSaveUser },
      },
    },
  },
  {
    resource: {
      model: getModel('Layout'),
      client: prisma,
    },
  },
  {
    resource: {
      model: getModel('Lead'),
      client: prisma,
    },
  },
  {
    resource: {
      model: getModel('ActivityEvent'),
      client: prisma,
    },
  },
];

module.exports = {
  resources
};