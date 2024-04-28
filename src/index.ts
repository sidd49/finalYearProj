import 'dotenv/config'
import Dockerode from  "dockerode";

class Client extends Dockerode {
    local: boolean = false
    constructor(options: Dockerode.DockerOptions) {
        super(options)
    }
    
}
type ContainerSample = {
    sampleAt: Date
    cpu: number
}
class Manager {
    clients: Array<Client> = []
    samples: Map<string, Array<ContainerSample>> = new Map()
}
const sample = async (manager: Manager) => {
    const client = manager.clients.find(c => c.local)
    if(client) {
        const items = await client.listContainers().then((containers) => {
            return Promise.all(
                containers
                .map(async (c) => {
                    return client.getContainer(c.Id).stats({stream: false, "one-shot": true}).then(d => ({
                        container_id: c.Id,
                        data: d,
                        sampleAt: new Date()
                    }))
                })
            )
        })
        items.forEach(item => {
            const containerId = item.container_id
            if(!manager.samples.has(containerId)) {
                manager.samples.set(containerId, [] as any)
            }
            manager.samples.get(containerId)?.push({
                sampleAt: new Date(),
                cpu: 0
            })
        })
    }
}

const processor = (manager: Manager) => {
    // go through all the samples containers and check if CPU usage is high
    // if we find the container crossing resource limit call migrate
}

const migrate = (manager: Manager, containerId: string) => {
    // go through all the clients in the manager and find the first remote client
    const localClient = manager.clients.find(c => c.local)
    const remoteClient = manager.clients.find(c => !c.local)
    if(localClient && remoteClient) {
        // collect info for given containerid from local client
        // using the above info create remote conta
        //remoteClient.run()
    }

}

const main = async () => {
    const manager = new Manager()
    const client = new Client({
        host:  process.env.DOCKER_HOST || 'localhost',
        port: Number(process.env.DOCKER_PORT || '2375'),
        protocol: 'http'
    })
    client.local = true
    manager.clients.push(client)

    setInterval(()=> sample(manager), 5000)
    setInterval(()=> processor(manager), 9000)
    sample(manager)
}

main()