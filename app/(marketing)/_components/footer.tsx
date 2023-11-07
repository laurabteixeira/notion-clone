import { Button } from '@/components/ui/button'
import { Logo } from './logo'
import { Instagram, Linkedin, Twitter } from 'lucide-react'
import { Separator } from '@/components/ui/separator'

export const Footer = () => {
  return (
    <div className="flex items-center w-full p-6 bg-background z-50 shadow-sm border-t">
      <div className="flex items-center gap-12">
        <Logo />
      </div>

      <div className="md:ml-auto w-full justify-between md:justify-end flex items-center gap-x-2 text-muted-foreground">
        <div className="mr-2 flex gap-3">
          <Instagram className="text-muted-foreground cursor-pointer" />
          <Linkedin className="text-muted-foreground cursor-pointer" />
          <Twitter className="text-muted-foreground cursor-pointer" />
        </div>
        <Separator orientation="vertical" className="h-6" />
        <Button variant="ghost" size="sm">
          Privacy Policy
        </Button>
        <Button variant="ghost" size="sm">
          Terms & Conditions
        </Button>
      </div>
    </div>
  )
}
