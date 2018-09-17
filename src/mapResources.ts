import { keyMap, keys, upperFirst } from './utils'
import { GraphQLString, GraphQLObjectType } from 'graphql'
import { mapParametersToArguments } from './mapParametersToArguments'
import makeApiRequest from './request'
import { Context } from '.'
import { resolve } from 'url'

const mapResources = (resources, context: Context) => {
  const { queryResolvers, resoversResources, resolverMap, graphQLTypes } = context

  return keyMap(resources, (resource, resourceDetails) => {
    const resourceName = `${upperFirst(resource)}_`

    resolverMap[resourceName] = {}

    resoversResources[resource] = parent => parent

    const mapMethod = (methodName, methodValue) => {
      const { description, parameters, httpMethod, path, request, response, supportsMediaDownload } = methodValue

      if (httpMethod !== 'GET') {
        return null
      }

      resolverMap[resourceName][methodName] = async (parent, args, ctx) => {
        const { rootArgs, rootDefinitions, baseUrl } = parent

        return await makeApiRequest({
          definitions: { ...rootDefinitions, ...parameters },
          args: { ...rootArgs, ...args },
          baseUrl,
          path,
          httpMethod
        })
      }

      return {
        type: response ? graphQLTypes[response.$ref] : GraphQLString,
        description,
        args: mapParametersToArguments(parameters, resource)
      }
    }

    const fields = keyMap(resourceDetails.methods, mapMethod)

    if (keys(fields || {}).length === 0) {
      return null
    }

    resolverMap[resource] = parent => parent

    return {
      type: new GraphQLObjectType({
        name: resourceName,
        fields
      })
    }
  })
}

export { mapResources }
