import { refreshAndRedirect } from '@/lib/refresh'
import { PageHeader } from '@/components/layout/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { SubmitButton } from '@/components/forms/submit-button'
import { ResettableForm } from '@/components/forms/resettable-form'
import { formKeyFromSearchParams } from '@/lib/form-key'
import {
  listTeamMembersAction,
  listPendingInvitesAction,
  inviteTeamMemberAction,
  acceptTeamInviteAction,
  removeTeamMemberAction,
} from '@/features/team/actions'
import { DestructiveActionButton } from '@/components/forms/destructive-action-button'
import { Button } from '@/components/ui/button'

export default async function TeamSettingsPage({
  searchParams,
}: {
  searchParams?: { refreshed?: string | string[]; error?: string }
}) {
  const [members, pendingInvites] = await Promise.all([
    listTeamMembersAction(),
    listPendingInvitesAction(),
  ])
  const formKey = formKeyFromSearchParams(searchParams)

  return (
    <div>
      <PageHeader
        title="Equipe"
        description="Convide outros profissionais para trabalhar com você"
        backHref="/settings"
      />

      {pendingInvites.length > 0 ? (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base">Convites recebidos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingInvites.map((invite) => (
              <div
                key={invite.id}
                className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-medium">{invite.name}</p>
                  <p className="text-muted-foreground text-sm">{invite.email}</p>
                </div>
                <ResettableForm
                  formKey={`invite-${invite.id}-${formKey}`}
                  action={async () => {
                    'use server'
                    await acceptTeamInviteAction(invite.id)
                    refreshAndRedirect('/settings/team')
                  }}
                >
                  <Button type="submit" className="min-h-11">
                    Aceitar convite
                  </Button>
                </ResettableForm>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Convidar membro</CardTitle>
        </CardHeader>
        <CardContent>
          <ResettableForm
            formKey={formKey}
            action={async (formData) => {
              'use server'
              const result = await inviteTeamMemberAction(formData)
              if (result.success) refreshAndRedirect('/settings/team')
              refreshAndRedirect('/settings/team?error=1')
            }}
            className="grid gap-4 sm:grid-cols-2"
          >
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="email">E-mail do profissional *</Label>
              <Input id="email" name="email" type="email" required className="min-h-11" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Função</Label>
              <select
                id="role"
                name="role"
                className="border-input bg-background min-h-11 w-full rounded-md border px-3 text-sm"
                defaultValue="member"
              >
                <option value="member">Membro</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div className="flex items-end">
              <SubmitButton>Enviar convite</SubmitButton>
            </div>
          </ResettableForm>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {members.map((member) => (
          <Card key={member.id}>
            <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium">{member.name}</p>
                <p className="text-muted-foreground text-sm">{member.email}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">{member.role}</Badge>
                <Badge variant="secondary">{member.status}</Badge>
                {member.status !== 'removed' ? (
                  <DestructiveActionButton
                    buttonLabel="Remover"
                    title="Remover membro"
                    description={`Remover ${member.name} da equipe?`}
                    action={async () => {
                      'use server'
                      await removeTeamMemberAction(member.id)
                      refreshAndRedirect('/settings/team')
                    }}
                  />
                ) : null}
              </div>
            </CardContent>
          </Card>
        ))}
        {members.length === 0 ? (
          <p className="text-muted-foreground text-sm">Nenhum membro na equipe.</p>
        ) : null}
      </div>
    </div>
  )
}
