import { gql } from 'graphql-request';

const newExperimentMutation = gql`
    mutation NewExperiment($input: ExperimentInput!) {
        newExperiment(input: $input) {
            info {
                id
                name
                createdAt
                ownerId
                spaceId
                tenantId
            }
        }
    }
`

const newExperimentVersionMutation = gql`
    mutation NewExperimentVersion($input: ExperimentVersionInput!) {
        newExperimentVersion(input: $input) {
            info {
                id
                createdAt
                ownerId
                spaceId
                tenantId
            }
        }
    }
`

export default {
    newExperimentMutation,
    newExperimentVersionMutation,
};