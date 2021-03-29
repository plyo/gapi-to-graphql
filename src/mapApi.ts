import { mapResources } from './mapResources'
import { keys, upperFirst } from './utils'
import { GraphQLSchema, GraphQLObjectType, printSchema, GraphQLInputObjectType } from 'graphql'
import { mapParametersToArguments } from './mapParametersToArguments'
import { Context } from '.'
import { schemaComposer } from 'graphql-compose';

const mapApi = (apiJson, context: Context) => {
  const { name, id, description, parameters, version, resources, baseUrl, schemas } = apiJson
  const { graphQLTypes, resolvers } = context

  const APIResources = `${upperFirst(name)}Resources`

  const queryTypeName = `${upperFirst(name)}ApiQuery`


  resolvers[queryTypeName] = { [`${upperFirst(name)}Api`]: (_, args)  => ({rootArgs: args, rootDefinitions: parameters, baseUrl}) }

  const resourceResolvers = {}
  resolvers[APIResources] = resourceResolvers

  const requestTypes = [];
  const fields = mapResources(resources, context.graphQLTypes, resourceResolvers, resolvers, requestTypes)

  if (keys(fields).length === 0) {
    throw `No fields for API ${id}`
  }
  const schema = new GraphQLSchema({
    query: new GraphQLObjectType({
      name: queryTypeName,
      fields: {
        [`${upperFirst(name)}Api`]: {
          args: {
            // we do not need to provide google auth options for GQL client
            // auth: {
            //   type: new GraphQLInputObjectType({
            //     name: queryTypeName + 'Auth',
            //     fields: mapParametersToArguments(parameters, 'Root')
            //   }),
            //   description: 'Auth details for request'
            // },
            request: {
              type: schemaComposer.createObjectTC(requestTypes[0]).getInputType(),
              description: 'Request body'
            },
          },
          type: new GraphQLObjectType({
            name: APIResources,
            fields
          })
        }
      }
    })
  })

  return { schema: printSchema(schema), resolvers }
}
export { mapApi }
