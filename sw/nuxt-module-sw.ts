import { join as joinPath, dirname } from 'path'
import { existsSync } from 'fs'
import { readdir, readFile, writeFile, stat, mkdir } from 'fs/promises'
import { NuxtModule } from 'nuxt/schema'
import {
  transpile as typescriptTranspile,
  CompilerOptions as TypescriptCompilerOptions,
} from 'typescript'
import {
  minify as terserMinify,
  MinifyOptions as TerserMinifyOptions,
} from 'terser'

export interface NuxtSwModuleOptions {
  inputDir?: string
  outputDir?: string
  tsConfig?: string | TypescriptCompilerOptions
  terserOptions?: TerserMinifyOptions
}

async function readTsConfig(
  inputPath: string,
  tsConfig: NuxtSwModuleOptions['tsConfig']
) {
  if (typeof tsConfig === 'object') return tsConfig

  try {
    const tsConfigPath = tsConfig ?? joinPath(inputPath, `../tsconfig.json`)
    const tsConfigContent = await readFile(tsConfigPath, 'utf8')
    return JSON.parse(tsConfigContent) as TypescriptCompilerOptions

    // ↓ Return default options on error
  } catch {
    return {}
  }
}

interface FilePath {
  input: string
  output: string
}
async function getAllFilePaths(
  inputDir: string,
  outputDir: string
): Promise<FilePath[]> {
  const files = await readdir(inputDir)

  const gettingPaths = files.map(async (file) => {
    const input = joinPath(inputDir, file)
    const output = joinPath(outputDir, file).replace(/\.ts$/, '.js')
    const stats = await stat(input)

    return stats.isDirectory()
      ? await getAllFilePaths(input, output)
      : { input, output }
  })

  const paths = await Promise.all(gettingPaths)
  return paths.flat()
}

async function transpileFile(
  { input: inputPath, output: outputPath }: FilePath,
  tsConfig: TypescriptCompilerOptions,
  terserOptions: TerserMinifyOptions = {}
): Promise<void> {
  try {
    const fileContent = await readFile(inputPath, 'utf8')

    const jsContent = inputPath.endsWith('ts')
      ? typescriptTranspile(fileContent, tsConfig)
      : fileContent

    const minifiedJs = await terserMinify(jsContent, terserOptions)
    const minifiedJsContent = minifiedJs.code
    if (!minifiedJsContent) return

    const outputDir = dirname(outputPath)
    if (!existsSync(outputDir)) await mkdir(outputDir, { recursive: true })

    return writeFile(outputPath, minifiedJsContent, { encoding: 'utf-8' })

    // ↓ This is the original code from the tutorial, but it doesn't work
  } catch (error) {
    console.error(`Error minifying ${inputPath}:`, error)
    return
  }
}

async function transpile(options: NuxtSwModuleOptions, changedPath?: string) {
  const {
    inputDir = './sw',
    outputDir = inputDir + '/dist',
    tsConfig: tsConfigOption,
    terserOptions,
  } = options

  if (changedPath) {
    const watchTargetPath = joinPath(inputDir, '../')
    if (!changedPath.startsWith(watchTargetPath)) return
  }

  const [filePaths, tsConfig] = await Promise.all([
    getAllFilePaths(inputDir, outputDir),
    readTsConfig(inputDir, tsConfigOption),
  ])

  const transpile = (filePath: FilePath) =>
    transpileFile(filePath, tsConfig, terserOptions)

  await Promise.all(filePaths.map(transpile))
}

export default function nuxtSwModule(options: NuxtSwModuleOptions = {}) {
  return <NuxtModule>(async (_, nuxt) => {
    nuxt.hooks.hook('build:before', () => transpile(options))
    nuxt.hooks.hook('builder:watch', (_, path) => transpile(options, path))
  })
}
