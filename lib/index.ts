import { Interfaces } from '@alecmmiller/nestjs-client-generator'
import * as fs from 'fs'

function makeDocs (entry: Interfaces.PropertyInfo): string[] {
  const lines = new Array<string>()

  if (entry.description !== undefined) {
    lines.push(`\t* ${entry.description}\n\t*`)
  }

  if (entry.example !== undefined) {
    lines.push(`\t* example: ${JSON.stringify(entry.example)}\n\t*`)
  }

  if (lines.length > 0) {
    lines.unshift('\t/**')
    lines.push('\t*/')
  }

  return lines
}

function makeEntry (entry: Interfaces.PropertyInfo): string[] {
  const fieldName = entry.name
  const fieldType = entry.type

  let implementation = `\t${fieldName}: ${fieldType}`
  if (entry?.isArray === true) {
    implementation += '[]'
  }

  const docs = makeDocs(entry)

  return [...docs, implementation, '']
}

function makeInterface (name: string, entries: Interfaces.ObjectInfo): string {
  const preamble = `interface ${name} {`
  const fields = entries.flatMap(entry => makeEntry(entry))
  fields[fields.length] = '}'
  const output = [preamble, ...fields].join('\n')
  return output
}

function makeEnum (enumInfo: Interfaces.EnumInfo): string {
  const preamble = `enum ${enumInfo.name} {`
  const fields = enumInfo.values.map(entry => `\t${entry.name} = "${entry.value}",`)
  fields[fields.length] = '}'
  const output = [preamble, ...fields].join('\n')
  return output
}

export function generator (representation: Interfaces.ProjectDefinition): void {
  const definitions = representation.definitions
  const objects = definitions.objects
  const interfaces = Array.from(objects).map(schema => makeInterface(...schema))
  const enumDefinitions = Array.from(definitions.enums).map(enumInfo => makeEnum(enumInfo[1]))

  const outputText = [...interfaces, ...enumDefinitions].join('\n\n')

  const generatedPath = './generated'
  const srcPath = `${generatedPath}/src`
  if (!fs.existsSync(generatedPath)) {
    fs.mkdirSync(generatedPath)
  }

  if (!fs.existsSync(srcPath)) {
    fs.mkdirSync(srcPath)
  }

  fs.writeFileSync(`${generatedPath}/src/index.ts`, outputText)

  const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'))
  const name = packageJson.name as string
  const license = packageJson.license as string
  const sourceTypescriptVersion = packageJson.devDependencies.typescript as string
  const sourceRepo = packageJson.repository as string
  const version = packageJson.version as string
  const outputPackageName = `${name}-interfaces`

  let repoInfo = ''

  if (sourceRepo !== undefined) {
    repoInfo = ` - see ${sourceRepo} for more information.`
  }

  const outputPackageJson = {
    name: outputPackageName,
    version,
    description: `Auto-generated API interface files for ${name}${repoInfo}`,
    main: 'lib/index.js',
    types: 'lib/index.d.ts',
    license,
    files: [
      'lib/**/*'
    ],
    devDependencies: {
      typescript: sourceTypescriptVersion
    },
    scripts: {
      build: 'tsc'
    }
  }

  fs.writeFileSync(`${generatedPath}/package.json`, JSON.stringify(outputPackageJson, null, 2))

  const outputTsConfig = {
    compilerOptions: {
      module: 'commonjs',
      target: 'es5',
      declaration: true,
      outDir: 'lib',
      strict: true
    }
  }

  fs.writeFileSync(`${generatedPath}/tsconfig.json`, JSON.stringify(outputTsConfig, null, 2))
}
