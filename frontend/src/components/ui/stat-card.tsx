import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import * as React from 'react'

export function StatCard({
  icon: Icon,
  title,
  value,
  badge,
  trend,
  description,
  trendIcon: TrendIcon,
  badgeValue,
  action,
}: {
  icon: React.ElementType
  title: string
  value: string | number
  badge?: string
  badgeValue?: string
  trend?: string
  description?: string
  trendIcon?: React.ElementType
  action?: React.ReactNode
}) {
  return (
    <Card className="@container/card">
      <CardHeader>
        <CardDescription>{title}</CardDescription>
        <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
          {value}
        </CardTitle>
        <div className="flex items-center gap-2 mt-2">
          {action}
          {badge && (
            <Badge variant="outline">
              {TrendIcon && <TrendIcon className="mr-1 h-4 w-4" />}
              {badge}
              {badgeValue && <span className="ml-1">{badgeValue}</span>}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardFooter className="flex-col items-start gap-1.5 text-sm">
        {trend && (
          <div className="line-clamp-1 flex gap-2 font-medium">
            {trend} {TrendIcon && <TrendIcon className="size-4" />}
          </div>
        )}
        {description && (
          <div className="text-muted-foreground">{description}</div>
        )}
      </CardFooter>
    </Card>
  )
} 