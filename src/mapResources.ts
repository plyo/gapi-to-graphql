import { keyMap, keys, upperFirst } from './utils'
import { GraphQLObjectType, GraphQLString } from 'graphql'
import { mapParametersToArguments } from './mapParametersToArguments'
import makeApiRequest from './request'

const mapResources = (resources, graphQLTypes, resourceResolvers, resolverMap, requestTypes) => {
  return keyMap(resources, (resource, resourceDetails) => {
    const resourceName = `${upperFirst(resource)}_`

    const mapMethod = (methodName, methodValue) => {
      const { description, parameters, httpMethod, path, request, response, supportsMediaDownload } = methodValue

      requestTypes.push(request ? graphQLTypes[request.$ref] : GraphQLString);
      const resolve = async (parent, args, ctx) => {
        const { rootArgs, rootDefinitions, baseUrl } = parent

        return await makeApiRequest({
          definitions: { ...rootDefinitions, ...parameters },
          args: { ...rootArgs.auth, ...args },
          baseUrl,
          path,
          httpMethod,
          body: rootArgs.request,
        })
      }

      if (!resolverMap[resourceName]) {
        resolverMap[resourceName] = {}
      }
      resolverMap[resourceName][methodName] = resolve

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

    resourceResolvers[resource] = parent => parent

    return {
      type: new GraphQLObjectType({
        name: resourceName,
        fields
      })
    }
  })
}

export { mapResources }
